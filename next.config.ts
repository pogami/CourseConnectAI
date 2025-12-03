
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/handler',
        destination: '/api/auth/handler',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    position: 'bottom-right'
  },
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Turbopack configuration (replaces webpack config)
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // External packages for server components
  serverExternalPackages: ['pdfjs-dist', '@napi-rs/canvas', 'pdf-parse'],
  // Exclude problematic test pages from build
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Webpack configuration for canvas/pdfjs-dist compatibility
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Disable canvas on client-side (not needed in browser)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@napi-rs/canvas': false,
        fs: false,
        path: false,
        os: false,
      };
    } else {
      // Externalize pdfjs-dist on server-side to avoid bundling issues
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pdfjs-dist', '@napi-rs/canvas');
      } else {
        config.externals = [config.externals, 'pdfjs-dist', '@napi-rs/canvas'];
      }
    }
    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    resolveAlias: {
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.min.js',
    },
  },
};

export default nextConfig;
