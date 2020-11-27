var webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	// optimization: {
 	//     minimize: false
	// }
	// optimization: {
	//     minimize: true,
	//     minimizer: [
	//         new TerserPlugin({
	//             terserOptions: {
	//                 keep_classnames: true,
	//                 keep_fnames: true
	//             }
	//           })
	//         ]
	// }
};