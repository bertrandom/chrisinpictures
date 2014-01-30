var sys = require('sys');
var exec = require('child_process').exec;

var Twit = require('twit');
var Twitter = require('node-twitter');

var config = require(__dirname + '/config.json');

var T = new Twit(config);

var twitterRestClient = new Twitter.RestClient(
    config.consumer_key,
    config.consumer_secret,
    config.access_token,
    config.access_token_secret
);

//var userId = '2318429736'; // @testytestytt
var userId = '1582853809'; // @HistoryInPics

var stream = T.stream('statuses/filter', { follow: userId });

stream.on('tweet', function (tweet) {

	var text = '',
		mediaUrl = '',
		localFile = '',
		blackAndWhite = false;	

	if (!tweet) {
		return;
	}

	if (tweet.retweeted_status) {
		return;
	}

	if (tweet.user && tweet.user.id_str != userId) {
		return;
	}

	console.log(tweet);

	if (tweet) {

		if (tweet.entities && tweet.entities.media && tweet.entities.media.length > 0) {

			var photo = tweet.entities.media[0];

			if (photo) {

				text = 'Chris and ' + tweet.text.substring(0, photo.indices[0] - 1);
				mediaUrl = photo.media_url;

				chrisMaskFile = __dirname + '/chris-mask.png';
				localFile = __dirname + '/pictures/' + tweet.id_str + '.jpg';
				outputFile = __dirname + '/pictures/' + tweet.id_str + '-chris.jpg';

				exec("curl -o " + localFile + ' ' + mediaUrl, function(error, stdout, stderr) {

					exec("convert " + localFile + " -colorspace HSL -channel g -separate +channel -format \"%[fx:mean]\" info:", function(error, stdout, stderr) {

						var colorness = parseFloat(stdout);

						if (colorness >= 0.1) {
							blackAndWhite = false;
						} else {
							blackAndWhite = true;
						}

						if (blackAndWhite) {
							chrisMaskFile = __dirname + '/chris-mask-bw.png';
						}

						console.log(__dirname + '/timetravel ' + localFile + ' ' + chrisMaskFile + ' ' + outputFile);

						exec(__dirname + '/timetravel ' + localFile + ' ' + chrisMaskFile + ' ' + outputFile, function(error, stdout, stderr) {

							twitterRestClient.statusesUpdateWithMedia(
							    {
							        'status': text,
							        'media[]': outputFile
							    },
							    function(error, result) {

							    	if (error) {
										console.log('Error: ' + (error.code ? error.code + ' ' + error.message : error.message));
        							}

							        if (result) {
							            console.log(result);
							        }

							    }
							);

						});

					});

				});

			}

		}

	}

});