amd-shim
========

Wraps a javascript file into an AMD module

An Example. Given `test.js` that assumes there's a `foo` like so:

    function MyVeryImportant() {
        foo();
    }

Then with `amd-shim.js -e MyVeryImportant -n MyVeryImportant -r foo -w < test.js > test.amd.js` gives an AMD module like so:

    define('MyVeryImportant', ['foo'], function () {
        function MyVeryImportant() {
            foo();
        }
        return MyVeryImportant;
    });

