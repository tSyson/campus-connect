import { Facebook, Twitter, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Logo Banner */}
      <div className="bg-red-700 py-4 flex justify-center">
        <img 
          src="/images/muni-logo.jpeg" 
          alt="Muni University logo" 
          className="h-12 w-auto object-contain rounded-lg bg-white/10 p-1"
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* INFO Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">INFO</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://www.muni.ac.ug" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-700 transition-colors">
                  University Website
                </a>
              </li>
              <li>
                <a href="https://library.muni.ac.ug" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-700 transition-colors">
                  Library Website
                </a>
              </li>
              <li>
                <a href="https://ebooks.muni.ac.ug" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-red-700 transition-colors">
                  E-Books (Intranet)
                </a>
              </li>
            </ul>
          </div>

          {/* CONTACT US Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">CONTACT US</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-center md:justify-start gap-2 text-blue-600">
                <MapPin className="h-4 w-4" />
                <span>P.O. Box 725, Arua - Uganda</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 text-blue-600">
                <Phone className="h-4 w-4" />
                <span>+256-476-420311/2/3</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <a href="mailto:dicts@muni.ac.ug" className="text-red-600 hover:underline">
                  dicts@muni.ac.ug
                </a>
              </li>
            </ul>
          </div>

          {/* GET SOCIAL Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">GET SOCIAL</h3>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <a 
                href="https://facebook.com/MuniUniversityOfficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1877F2] text-white p-2 rounded-md hover:opacity-90 transition-opacity"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/muniuni" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#1DA1F2] text-white p-2 rounded-md hover:opacity-90 transition-opacity"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-200 py-4 text-center">
        <p className="text-gray-600 text-sm">
          Copyright © {new Date().getFullYear()} - Muni University
        </p>
      </div>
    </footer>
  );
}
