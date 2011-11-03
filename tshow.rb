# tshow.rb
require 'json'
require 'sinatra'
require 'haml'
require 'twitter'
require 'open-uri'
require 'hpricot'



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


get '/update' do
  begin
    # Initialize a Twitter search
    client = Twitter::Client.new
    tweets = {}
    client.search("#nyuef", {:result_type => "recent"}).each do |tweetItem|
      tweet = {:text => tweetItem[:text], :urls => []}
      if (tweetItem[:entities] && mediaItems = tweetItem[:entities][:media])
        mediaItems.each do |mediaItem|
          tweet[:urls].push(mediaItem[:media_url] + ":large")
        end
      end
      tweets[tweetItem[:id]] = tweet
    end
    tweets.to_json
    # f = open("http://t.co/ibyLuOMS")
    # 
    # doc = Hpricot.parse(f)
    # images = []
    # 
    # (doc/:div).each do |img|
    #   images.push(img.attributes)
    # end
    # images.to_json
  rescue => e
    "Error!" + e.to_s.to_json
  end
end