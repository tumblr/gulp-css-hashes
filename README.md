# gulp-css-hashes

This nifty gulp plugin parses stylesheets and appends checksums for images and fonts referenced in that stylesheet using `url(...)`.
The purpose of this plugin is to make sure that when you update an asset you are referencing from CSS, that updated version is requested on the client.

### Options

List of available options:

#### `assetsPath`
Type: `String`
Default value: `www`

Relative path that points to where images are located. That path will be used to read images and fonts referenced from CSS and calculate checksums.

#### `allowMissingFiles`
Type: `Bool`
Default value: `false`

When set to false, plugin will error if it tries to read a file that CSS references, but that file does not exist. Change this to `true` to log only in those cases.

#### `hashableExtensions`
Type: `Array`
Default value: `['png', 'gif', 'jpg', 'jpeg', 'svg', 'woff', 'woff2', 'otf', 'eot', 'ttf']`

Array of strings with file extensions of files that need to be processed.

### Usage

```javascript
    const gulpCssHashes = require('gulp-css-hashes');

    gulp.src('path/to/source/css')
        .pipe(gulpCssHashes())
        .pipe(gulp.dest('path/to/destination'));
```

### Support

Feel free to open issue on github if you encounter a bug.

### License

Copyright 2016-2019 Tumblr Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
