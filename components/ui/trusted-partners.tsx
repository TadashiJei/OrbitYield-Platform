"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle, ExternalLink } from "lucide-react";

export function TrustedPartners() {
  const partners = [
    {
      name: "Polkadot",
      logo: "/partners/polkadot-main-logo.svg",
      url: "https://polkadot.network",
      description: "Main Partner & Blockchain Infrastructure",
      relationship: "Strategic Blockchain Partner",
      connectionDate: "Since 2023",
      highlight: "Powering cross-chain interoperability"
    },
    {
      name: "ShiftSolv3d",
      logo: "/partners/shiftsolv3d-logo.svg",
      url: "https://shiftsolv3d.com",
      description: "Professional Logo & Brand Design",
      relationship: "Design Partner",
      connectionDate: "Since 2024",
      highlight: "Created the OrbitYield visual identity"
    },
    {
      name: "JavaCraftHosting",
      logo: "/partners/javacrafthosting-logo.svg",
      url: "https://javacrafthosting.com",
      description: "Enterprise Server Infrastructure",
      relationship: "Hosting Partner",
      connectionDate: "Since 2024",
      highlight: "99.9% uptime guaranteed infrastructure"
    }
  ];

  return (
    <div className="py-16 relative z-10">
      <div className="text-center mb-16">
        <div className="relative mx-auto max-w-max mb-6">
          <span className="absolute inset-0 rounded-full blur-md bg-polkadot-cyan/20"></span>
          <span className="relative block rounded-full bg-polkadot-cyan/20 px-4 py-1.5 text-sm font-semibold text-polkadot-cyan tracking-wide">
            <Trophy className="inline-block h-4 w-4 mr-2" />TRUSTED PARTNERS
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 heading tracking-tight">
          <span className="bg-gradient-to-r from-polkadot-cyan via-polkadot-purple to-polkadot-pink bg-clip-text text-transparent">Backed by Industry Leaders</span>
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
          OrbitYield partners with the best companies in blockchain and technology to deliver a secure and powerful yield optimization experience
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </div>
    </div>
  );
}

function PartnerCard({ partner }: { partner: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg group-hover:shadow-polkadot-purple/20 group-hover:border-polkadot-purple/30">
        <div className="p-1">
          <div className="bg-gradient-to-b from-slate-800/60 to-slate-800/30 rounded-xl p-5">
            {/* Badge */}
            <div className="flex items-center justify-between mb-4">
              <Badge variant="outline" className="bg-polkadot-purple/10 text-polkadot-purple border-polkadot-purple/30">
                {partner.relationship}
              </Badge>
              <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            {/* Logo */}
            <div className="flex justify-center my-6 h-20">
              <Image 
                src={partner.logo} 
                alt={partner.name} 
                width={180} 
                height={60} 
                className="object-contain"
              />
            </div>
            
            {/* Content */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-white">
                {partner.name}
              </h3>
              
              <p className="text-gray-300">
                {partner.description}
              </p>
              
              <div className="flex items-center justify-center gap-1 text-emerald-400 text-sm">
                <CheckCircle className="h-4 w-4" /> {partner.connectionDate}
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <div className="text-xs text-white/70">
                  {partner.highlight}
                </div>
                <Link href={partner.url} target="_blank" className="text-polkadot-cyan text-sm font-medium flex items-center group-hover:text-polkadot-pink transition-colors">
                  Learn More <ExternalLink className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
