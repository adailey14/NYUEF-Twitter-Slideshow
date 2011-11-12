# tshow.rb
require 'rubygems'
require 'json'
require 'sinatra'
require 'haml'
require 'twitter'


#Configure Twitter API on startup. This info is Andrew Dailey's and should probably be kept more secret. How?
Twitter.configure do |config|
  config.consumer_key = "zbRBK4m4Xl7H3tjFTmBmOQ"
  config.consumer_secret = "FyKXvCupasKYjixBa3cDf4uZDTgwltc5x7sQwbeA1w"
  config.oauth_token = "69807624-nS2bkXeo5zR1nF9fzIKvizOFVeczYSbl2mAdzzHA4"
  config.oauth_token_secret = "F8hYITKVw5ldtrz0WvTc2BUZQrdUJNXEunSZAhn9s"
end

#Routes:

# serve up the main page, provided in main.haml wrapped in layout.haml
get '/' do
  @hash = if params[:hashtag]
		'#' + params[:hashtag]
	else
		"#nyuef"
	end
  haml :main
end


# serve ajax requests by searching the twitter api and returning any new results
get '/update/?:lastid?' do
  begin
    # Initialize a Twitter search
    client = Twitter::Client.new
    tweets = []

    if params[:lastid]
    	latestid = params[:lastid].to_i
	else
		latestid = 0
	end

	hash = if params[:hashtag]
		params[:hashtag]
	else
		"nyuef"
	end

    results = client.search("#"+hash, {:recent_type => "recent", :since_id => (latestid+1), :count => 99})

    results.each do |tweetItem|
      tweet = {:text => tweetItem[:text], :urls => [], :from_user => tweetItem[:user][:name]}
      puts("TweetItem ID " + tweetItem[:id].to_s)
      if (tweetItem[:id] > latestid)
      	latestid = tweetItem[:id]
  	  end
      if (tweetItem[:entities] && (mediaItems = tweetItem[:entities][:media]))
        mediaItems.each do |mediaItem|
          tweet[:urls].push(mediaItem[:media_url] + ":large")
        end
      end
      tweets.push(tweet)
    end
    {:tweets => tweets.reverse(), :latestid => latestid.to_s}.to_json
  rescue => e
    "Error!" + e.to_s.to_json
  end
end