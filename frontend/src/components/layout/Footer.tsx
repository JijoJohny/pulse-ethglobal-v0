import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Github, 
  Twitter, 
  MessageCircle as Discord, 
  ExternalLink,
  Heart
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: 'Markets', href: '/markets' },
      { name: 'Positions', href: '/positions' },
      { name: 'Analytics', href: '/analytics' },
      { name: 'Documentation', href: '/docs' },
    ],
    Community: [
      { name: 'Discord', href: 'https://discord.gg/pulse08', external: true },
      { name: 'Twitter', href: 'https://twitter.com/pulse08', external: true },
      { name: 'GitHub', href: 'https://github.com/pulse-08', external: true },
      { name: 'Telegram', href: 'https://t.me/pulse08', external: true },
    ],
    Resources: [
      { name: 'Rootstock', href: 'https://rootstock.io', external: true },
      { name: 'The Graph', href: 'https://thegraph.com', external: true },
      { name: 'Bitcoin', href: 'https://bitcoin.org', external: true },
      { name: 'CLMSR Docs', href: '/docs/clmsr', external: true },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Disclaimer', href: '/disclaimer' },
    ],
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-secondary-200 dark:border-secondary-700">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Pulse-08</span>
            </Link>
            <p className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md">
              Decentralized prediction markets on Rootstock Bitcoin sidechain with The Graph integration.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com/pulse-08"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/pulse08"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/pulse08"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
              >
                <Discord className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    {(link as any).external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                      >
                        <span>{link.name}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-secondary-200 dark:border-secondary-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400">
              <span>© {currentYear} Pulse-08. Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for the Bitcoin ecosystem</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-secondary-600 dark:text-secondary-400">
              <span>Built on</span>
              <a
                href="https://rootstock.io"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Rootstock
              </a>
              <span>•</span>
              <a
                href="https://thegraph.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                The Graph
              </a>
              <span>•</span>
              <a
                href="https://bitcoin.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Bitcoin
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
