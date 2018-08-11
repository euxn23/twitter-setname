#!/usr/bin/env node

const Twitter = require('twitter')
const util = require('util')

const main = () => {
  const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  })

  const setNameKeyword = process.env.TWITTER_SET_NAME_KEYWORD || 'setName'
  const setNameRegExp = new RegExp(String.raw`${setNameKeyword}\s(.*)$`)
  const setNameFinishMessage = process.env.TWITTER_SET_NAME_FINISH_MESSAGE

  client.get('account/verify_credentials', (err, userInfo) => {
    if (err) throw err
    const screenName = userInfo.screen_name

    const handleTweet = tweet => {
      if (tweet.in_reply_to_screen_name === screenName) {
        console.log(tweet.text)
        const newName = (tweet.text.match(setNameRegExp) || [])[1]
        if (newName) {
          client.post('account/update_profile', { name: newName }, err => {
            if (err) return console.error(err)
            client.post('statuses/update', {
              status: `@${tweet.user.screen_name} ${newName}${setNameFinishMessage}`,
              in_reply_to_status_id: tweet.id
            })
          })
        }
      }
    }

    const handleStream = stream => {
      stream.on('data', handleTweet)
      stream.on('error', err => {
        throw err
      })
    }
    client.stream('user', handleStream)
  })
}

main()
