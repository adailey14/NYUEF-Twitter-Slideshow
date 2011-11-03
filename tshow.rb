# tshow.rb
require 'json'
require 'sinatra'
require 'haml'
require 'twitter'
require 'open-uri'


#startup script:
Twitter.configure do |config|
  config.consumer_key = "zbRBK4m4Xl7H3tjFTmBmOQ"
  config.consumer_secret = "FyKXvCupasKYjixBa3cDf4uZDTgwltc5x7sQwbeA1w"
  config.oauth_token = "69807624-nS2bkXeo5zR1nF9fzIKvizOFVeczYSbl2mAdzzHA4"
  config.oauth_token_secret = "F8hYITKVw5ldtrz0WvTc2BUZQrdUJNXEunSZAhn9s"
end

#Routes:


get '/' do
  haml :main
end

def customSearch(client, q)
	options = {:result_type => "recent"}
	client.get("/search", options.merge(:q => q))['results'].map do |status|
      Twitter::Status.new(status)
    end
end


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

	hash = if params[:hash]
		params[:hash]
	else
		"nyuef"
	end

    results = client.search("#"+hash, {:recent_type => "recent", :since_id => (latestid+1), :count => 99})

	puts("Latest ID " + (latestid+1).to_s)

    results.each do |tweetItem|
      tweet = {:text => tweetItem[:text], :urls => []}
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