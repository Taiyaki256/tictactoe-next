/** @type {import('next').NextConfig} */

const path = require('path');
const nextConfig = {
    export:"./out",
    webpack(config, options) {
        config.resolve.alias['@'] = path.join(__dirname, 'src')
        return config;
      },
};

export default nextConfig;
