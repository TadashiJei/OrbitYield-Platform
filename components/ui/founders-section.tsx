"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Linkedin, Github, Twitter, Users } from "lucide-react";
import Link from "next/link";

type FounderProps = {
  name: string;
  role: string;
  bio: string;
  imagePath: string;
  socialLinks: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
};

export function FoundersSection() {
  const founders: FounderProps[] = [
    {
      name: "Andrea Faith Alimorong",
      role: "Founder, Full-Stack Developer",
      bio: "Visionary leader with expertise in creating intuitive user experiences and developing robust backend systems. Passionate about building technology that transforms the DeFi landscape.",
      imagePath: "/team/andrea.jpg",
      socialLinks: {
        linkedin: "https://linkedin.com/in/andrea-faith-alimorong",
        github: "https://github.com/andrea-faith",
        twitter: "https://twitter.com/andreafaith"
      }
    },
    {
      name: "Java Jay Bartolome",
      role: "Co-Founder, Full-Stack Developer, Blockchain Expert",
      bio: "Blockchain specialist with deep knowledge of decentralized systems and cross-chain interoperability. Expertise in smart contract development and implementing secure financial protocols.",
      imagePath: "/team/java-jay.jpg",
      socialLinks: {
        linkedin: "https://linkedin.com/in/java-jay-bartolome",
        github: "https://github.com/TadashiJei",
        twitter: "https://twitter.com/JavaJay"
      }
    }
  ];

  return (
    <div className="py-16 relative z-10">
      <div className="text-center mb-16">
        <div className="relative mx-auto max-w-max mb-6">
          <span className="absolute inset-0 rounded-full blur-md bg-polkadot-pink/20"></span>
          <span className="relative block rounded-full bg-polkadot-pink/20 px-4 py-1.5 text-sm font-semibold text-polkadot-pink tracking-wide">
            <Users className="inline-block h-4 w-4 mr-2" />MEET THE TEAM
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading tracking-tight">
          <span className="bg-gradient-to-r from-polkadot-pink via-polkadot-purple to-polkadot-cyan bg-clip-text text-transparent">Founded by Experts</span>
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
          The minds behind OrbitYield bring together expertise in blockchain technology, financial systems, and user experience design.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10">
        {founders.map((founder, index) => (
          <FounderCard key={founder.name} founder={founder} index={index} />
        ))}
      </div>
    </div>
  );
}

function FounderCard({ founder, index }: { founder: FounderProps; index: number }) {
  // Create placeholder circular gradient for founders without images
  const placeholderGradient = index === 0 
    ? "bg-gradient-to-br from-polkadot-pink via-polkadot-purple to-polkadot-cyan" 
    : "bg-gradient-to-br from-polkadot-cyan via-polkadot-purple to-polkadot-pink";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-polkadot-purple/20 hover:border-polkadot-purple/30 p-1">
        <div className="bg-gradient-to-b from-slate-800/60 to-slate-800/30 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden shrink-0 border-2 border-polkadot-purple/30 shadow-lg shadow-polkadot-purple/20">
              <Image 
                src={founder.imagePath}
                alt={founder.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <h3 className="text-2xl font-bold text-white">
                {founder.name}
              </h3>
              
              <div className="text-polkadot-purple font-medium">
                {founder.role}
              </div>
              
              <p className="text-gray-300">
                {founder.bio}
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center md:justify-start gap-4">
                {founder.socialLinks.linkedin && (
                  <Link 
                    href={founder.socialLinks.linkedin} 
                    target="_blank" 
                    className="text-slate-400 hover:text-polkadot-cyan transition-colors"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Link>
                )}
                {founder.socialLinks.github && (
                  <Link 
                    href={founder.socialLinks.github} 
                    target="_blank" 
                    className="text-slate-400 hover:text-polkadot-cyan transition-colors"
                  >
                    <Github className="h-5 w-5" />
                  </Link>
                )}
                {founder.socialLinks.twitter && (
                  <Link 
                    href={founder.socialLinks.twitter} 
                    target="_blank" 
                    className="text-slate-400 hover:text-polkadot-cyan transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
