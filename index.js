'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var _ = require('lodash');
var through = require('through2');
var chalk = require('chalk');
var when = require('when');
var PluginError = require('gulp-util').PluginError;

/**
 * gulp-css-hashes is a gulp plugin that parses a stylesheet and appends checksums for
 * images and fonts referenced in that stylesheet using `url(...)`
 *
 * @param {object} options - Options object
 * @return {stream} - through2 stream
 */
var gulpCSSHashes = function(options) {
    options = options || {};

    // Matches urls and has two matching groups: (1) complete url statement (2) url
    var urlPattern = /(url(?:\(['|"]?)(.*?)(?:['|"]?\)))/g;

    // All extensions that are going to be hashed
    var hashableExtensions = options.hashableExtensions || ['png', 'gif', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'otf', 'eot', 'ttf'];

    // Gives a link to a file referenced by css url
    var assetPath = _.partial(path.join, (options.assetsPath) ? options.assetsPath : 'www');

    // Cache contains results for urls that were already parsed
    var cache = [];

    // Whether to allow having files referenced in CSS but not existing in fs
    var allowMissingFiles = options.allowMissingFiles || false;

    /**
     * Read the file at the url, calculate hash and return hashed url.
     * Promise resolves with result object that has the original url and hashed url, if file exists.
     *
     * @param {object} match - Regex result
     * @returns {promise} - Promise that resolves with hashing result
     */
    function hashifyUrl(match) {
        return when.promise(function(resolve, reject) {
            var url = match[2].split(' ').join(''),
                result = {
                    originalUrl: match[1],
                };

            if (cache[url]) {
                result.hashedUrl = cache[url];
                resolve(result);
                return;
            }

            var hash = crypto.createHash('md5');
            var fileStream = fs.createReadStream(assetPath(url));

            fileStream.on('error', function(e) {
                if (e.code === 'ENOENT') {
                    var message = 'File ' + url + ' is referenced in a stylesheet but does not exist';
                    if (allowMissingFiles) {
                        console.log(chalk.yellow(message));
                        resolve(result);
                    } else {
                        reject(new Error(message));
                    }
                } else {
                    reject(e);
                }
            });

            fileStream.on('data', function(data) {
                hash.update(data);
            });

            fileStream.on('end', function() {
                var hashedUrl = 'url(\'' + url + '?v=' + hash.digest('hex') + '\')';
                result.hashedUrl = cache[url] = hashedUrl;
                resolve(result);
            });

        });
    }

    /**
     * Parses all urls in a stylesheet and appends check sums in urls.
     *
     * @param {string} css - Sting containing stylesheet
     * @return {promise} - Promise that resolves with processed CSS
     */
    function replaceUrls(css) {
        var match;
        var hashifiers = [];

        while ((match = urlPattern.exec(css)) !== null) {
            var url = match[2].split(' ').join('');
            var extension = url.substr(url.lastIndexOf('.') + 1).toLowerCase();

            if (url.indexOf('data:') !== 0 && url.indexOf('#') !== 0 && hashableExtensions.indexOf(extension) !== -1) {
                hashifiers.push(hashifyUrl(match));
            }
        }

        if (hashifiers) {
            return when.all(hashifiers).then(function(results) {
                _.each(results, function(result) {
                    if (result.hashedUrl) {
                        css = css.replace(result.originalUrl, result.hashedUrl);
                    }
                });
                return css;
            });
        } else {
            return when.resolve(css);
        }
    }

    return through.obj(function(file, enc, callbackStream) {
        replaceUrls(file.contents.toString()).then(_.bind(function(css) {
            file.contents = new Buffer(css);
            this.push(file);
            callbackStream();
        }, this)).catch(function(error) {
            callbackStream(new PluginError('gulp-css-hashes', error));
        });
    });
};

module.exports = gulpCSSHashes;
