/** @type {import('next').NextConfig} */

// import { path } from 'node:path'
const nextConfig = {
    output: 'export',
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    }
    // webpack(config, options) {
    //     config.resolve.alias['@'] = path.join(__dirname, 'src')
    //     return config;
    //   },
};

export default nextConfig;
