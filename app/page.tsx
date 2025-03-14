"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronRight, Shield, Layers, BarChart3, Wallet, ArrowRightLeft, Sparkles, Zap, LineChart, CircleDollarSign, Boxes, PieChart, Cpu, Globe, Activity, BarChart, Diamond, Database, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import DotPattern from "@/components/ui/dot-pattern"
import DisplayCards from "@/components/ui/display-cards"
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects"
import BeamsBackground from "@/components/ui/beams-background"
import { TrustedPartners } from "@/components/ui/trusted-partners"
import { FoundersSection } from "@/components/ui/founders-section"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] bg-black/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto py-4 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-auto">
                <Image 
                  src="/Original-Logo.svg" 
                  alt="OrbitYield" 
                  width={160} 
                  height={40} 
                  priority
                  className="h-10 w-auto"
                />
              </div>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-polkadot-cyan transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-polkadot-cyan transition-colors">
              How It Works
            </Link>
            <Link href="#benefits" className="text-sm font-medium text-gray-300 hover:text-polkadot-cyan transition-colors">
              Tokenomics
            </Link>
            <Link href="#faq" className="text-sm font-medium text-gray-300 hover:text-polkadot-cyan transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-md border-[#1a1a1a] bg-black/60 text-polkadot-cyan hover:bg-black/80 hover:border-polkadot-cyan transition-all">
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="rounded-md bg-gradient-to-r from-polkadot-cyan to-polkadot-purple hover:opacity-90 text-white relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-polkadot-pink to-polkadot-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative z-10 flex items-center">Connect Wallet <Wallet className="ml-2 h-4 w-4" /></span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Updated with modern/futuristic design */}
      <section className="web3-dark-gradient py-24 text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-black">
          <div className="absolute inset-0 hexagon-pattern opacity-40"></div>
          <div className="absolute w-full h-full cyber-grid opacity-15"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/5 w-64 h-64 rounded-full bg-gradient-to-r from-polkadot-pink to-purple-700 opacity-20 blur-[80px] animate-float-slow"></div>
          <div className="absolute bottom-1/3 right-1/5 w-80 h-80 rounded-full bg-gradient-to-r from-blue-500 to-polkadot-cyan opacity-20 blur-[100px] animate-float"></div>
          
          {/* Animated Lines */}
          <div className="absolute inset-0 circuit-pattern opacity-10"></div>
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* High-Tech Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full border border-polkadot-cyan/30 bg-gradient-to-r from-black/60 to-polkadot-cyan/10 backdrop-blur-sm text-xs font-medium text-polkadot-cyan glow-text-pulse mb-2 animate-pulse-subtle">
                <Cpu className="mr-2 h-3 w-3" /> <span className="relative">Web3 Native Yield Optimizer <span className="absolute -right-1 -top-1 h-2 w-2 bg-polkadot-cyan rounded-full animate-ping"></span></span>
              </div>
              
              {/* Modern Headline */}
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Revolution in</span><br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-polkadot-cyan to-blue-400 glow-text">Cross-Chain</span> <span className="bg-clip-text text-transparent bg-gradient-to-r from-polkadot-pink to-purple-500 glow-text-pink">DeFi Yields</span>
              </h1>
              
              {/* Futuristic Subheadline */}
              <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed">
                Experience quantum-grade yield optimization across all major blockchains with AI-driven rebalancing and institutional-grade security.
              </p>
              
              {/* Stats Section with Techno UI */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="flex flex-col items-center border border-[#1a1a1a] bg-black/50 backdrop-blur-sm rounded-lg p-3 glow-border hover:border-polkadot-cyan/50 transition-all duration-300">
                  <div className="text-polkadot-cyan glow-text font-mono text-2xl font-bold flex items-center">
                    25%<span className="text-polkadot-pink">+</span>
                    <span className="ml-1 w-2 h-4 bg-polkadot-cyan/70 animate-blink"></span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Higher APY</div>
                </div>
                
                <div className="flex flex-col items-center border border-[#1a1a1a] bg-black/50 backdrop-blur-sm rounded-lg p-3 glow-border hover:border-polkadot-cyan/50 transition-all duration-300">
                  <div className="text-polkadot-purple glow-text-pink font-mono text-2xl font-bold flex items-center">
                    $87M<span className="text-polkadot-cyan">+</span>
                    <span className="ml-1 w-2 h-4 bg-polkadot-purple/70 animate-blink-delay"></span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">TVL</div>
                </div>
                
                <div className="flex flex-col items-center border border-[#1a1a1a] bg-black/50 backdrop-blur-sm rounded-lg p-3 glow-border hover:border-polkadot-cyan/50 transition-all duration-300">
                  <div className="text-polkadot-cyan glow-text font-mono text-2xl font-bold flex items-center">
                    5-10<span className="text-polkadot-pink">x</span>
                    <span className="ml-1 w-2 h-4 bg-polkadot-cyan/70 animate-blink-long"></span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Gas Savings</div>
                </div>
              </div>
              
              {/* CTA Buttons with Futuristic Design */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link href="/dashboard">
                  <Button className="w-full sm:w-auto neo-brutalism-button bg-gradient-to-br from-polkadot-cyan to-blue-600 hover:from-polkadot-pink hover:to-purple-600 text-white relative overflow-hidden group transition-all duration-300">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-polkadot-pink to-polkadot-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="absolute inset-0 grid grid-cols-6 w-full h-full">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-full w-full border-r border-white/5"></div>
                      ))}
                    </span>
                    <span className="relative z-10 flex items-center">Connect Wallet <Wallet className="ml-2 h-4 w-4 text-polkadot-pink group-hover:text-polkadot-cyan transition-colors" /></span>
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" className="w-full sm:w-auto cyberpunk-outline-button text-gray-300 hover:text-white border border-[#1a1a1a] hover:border-polkadot-cyan/70 transition-all duration-300">
                    <span className="relative z-10 flex items-center">Explore Platform <ChevronRight className="ml-1 h-4 w-4" /></span>
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Interactive Dashboard Preview */}
            <div className="relative">
              <div className="relative mx-auto lg:mx-0 max-w-md">
                <div className="absolute -z-10 -inset-0.5 bg-gradient-to-r from-polkadot-pink via-polkadot-purple to-polkadot-cyan rounded-xl blur-sm opacity-50"></div>
                <div className="relative bg-background rounded-xl overflow-hidden">
                  <div className="aspect-video w-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="max-w-[80%] bg-card rounded-xl p-6 shadow-lg border border-border">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-3 w-3 rounded-full bg-polkadot-pink"></div>
                        <div className="h-3 w-3 rounded-full bg-background"></div>
                        <div className="h-3 w-3 rounded-full bg-background"></div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-6 w-32 bg-border/50 rounded-md"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-border/30 rounded-sm"></div>
                          <div className="h-4 w-full bg-border/30 rounded-sm"></div>
                          <div className="h-4 w-2/3 bg-border/30 rounded-sm"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="h-16 bg-polkadot-pink/10 rounded-lg border border-polkadot-pink/20 flex items-center justify-center">
                            <div className="h-6 w-16 bg-polkadot-pink/30 rounded-md"></div>
                          </div>
                          <div className="h-16 bg-polkadot-purple/10 rounded-lg border border-polkadot-purple/20 flex items-center justify-center">
                            <div className="h-6 w-16 bg-polkadot-purple/30 rounded-md"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="p-4 rounded-lg border border-polkadot-cyan/20 bg-background/80 backdrop-blur-md relative overflow-hidden group hover:border-polkadot-cyan/50 transition-all duration-300">
                      <div className="absolute -top-12 -right-12 w-24 h-24 bg-polkadot-cyan/20 rounded-full blur-xl group-hover:bg-polkadot-cyan/30 transition-all duration-500"></div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2 w-2 rounded-full bg-polkadot-cyan animate-pulse"></div>
                        <span className="text-xs font-semibold text-polkadot-cyan uppercase tracking-widest">Real-time Analytics</span>
                      </div>
                      
                      <h4 className="text-xl font-bold mb-2 heading bg-gradient-to-r from-polkadot-cyan to-blue-400 bg-clip-text text-transparent">Intuitive Dashboard</h4>
                      
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">Monitor and manage your investments across multiple blockchains with advanced analytics and real-time yield data</p>
                      
                      <Link href="/dashboard" className="group/button inline-flex items-center rounded-full bg-polkadot-cyan/10 border border-polkadot-cyan/20 px-4 py-2 text-sm font-medium text-polkadot-cyan hover:bg-polkadot-cyan/20 transition-all duration-300">
                        <span>Explore Dashboard</span>
                        <div className="relative ml-2 h-5 w-5 rounded-full bg-polkadot-cyan/20 flex items-center justify-center group-hover/button:bg-polkadot-cyan/30 transition-all duration-300">
                          <ArrowRight className="h-3 w-3 text-polkadot-cyan group-hover/button:translate-x-0.5 transition-transform duration-300" />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="relative py-24 overflow-hidden border-t border-[#1A1A1A]">
        <div className="absolute inset-0 bg-grid-small-white/[0.02] [mask-image:radial-gradient(white,transparent_85%)]"></div>
        <div className="absolute h-48 bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-block rounded-full bg-polkadot-pink/10 px-3 py-1 text-sm font-medium text-polkadot-pink mb-4">
              <Sparkles className="w-4 h-4 inline-block mr-1" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-polkadot-pink to-polkadot-cyan">
              Key Features
            </h2>
            <p className="mt-3 text-xl text-gray-400 max-w-2xl mx-auto">
              OrbitYield brings powerful features to help you maximize your yield farming returns
            </p>
          </div>
          
          <FeaturesSectionWithHoverEffects />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative overflow-hidden my-0">
        <BeamsBackground intensity="subtle" className="">
          <div className="container mx-auto px-4 md:px-6 py-20 relative z-10">
            <div className="text-center mb-16">
              <div className="relative mx-auto max-w-max mb-6">
                <span className="absolute inset-0 rounded-full blur-md bg-polkadot-purple/20"></span>
                <span className="relative block rounded-full bg-polkadot-purple/20 px-4 py-1.5 text-sm font-semibold text-polkadot-purple tracking-wide">
                  <Zap className="inline-block h-4 w-4 mr-2" />SIMPLE PROCESS
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 heading tracking-tight">
                <span className="bg-gradient-to-r from-polkadot-purple via-polkadot-pink to-polkadot-cyan bg-clip-text text-transparent">How OrbitYield Works</span>
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10">
                Our platform simplifies yield farming across multiple blockchains with a straightforward three-step process
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-pink/50 hover:shadow-lg hover:shadow-polkadot-pink/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-pink/10 rounded-full blur-xl group-hover:bg-polkadot-pink/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-polkadot-pink flex items-center justify-center mb-6 text-white font-bold text-xl">1</div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-pink group-hover:translate-x-1 transition-all duration-300">Deposit Assets</h3>
                  <p className="text-gray-300 mb-6">
                    Connect your wallet and deposit your assets into OrbitYield's smart contracts.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-pink/10 text-polkadot-pink flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-pink/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Multiple blockchain support</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-pink/10 text-polkadot-pink flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-pink/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Support for various tokens</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-pink/10 text-polkadot-pink flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-pink/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Secure transaction processing</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-purple/50 hover:shadow-lg hover:shadow-polkadot-purple/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-purple/10 rounded-full blur-xl group-hover:bg-polkadot-purple/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-polkadot-purple flex items-center justify-center mb-6 text-white font-bold text-xl">2</div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-purple group-hover:translate-x-1 transition-all duration-300">Auto-Allocation</h3>
                  <p className="text-gray-300 mb-6">
                    Our platform automatically allocates your funds to the highest-yielding opportunities.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-purple/10 text-polkadot-purple flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-purple/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">AI-powered decision making</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-purple/10 text-polkadot-purple flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-purple/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Real-time APY tracking</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-purple/10 text-polkadot-purple flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-purple/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Risk-adjusted yield optimization</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-cyan/50 hover:shadow-lg hover:shadow-polkadot-cyan/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-cyan/10 rounded-full blur-xl group-hover:bg-polkadot-cyan/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-polkadot-cyan flex items-center justify-center mb-6 text-white font-bold text-xl">3</div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-cyan group-hover:translate-x-1 transition-all duration-300">Earn & Withdraw</h3>
                  <p className="text-gray-300 mb-6">
                    Earn yield across multiple chains and withdraw your assets with earned returns at any time.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-cyan/10 text-polkadot-cyan flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-cyan/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Track your portfolio growth</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-cyan/10 text-polkadot-cyan flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-cyan/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Flexible withdrawal options</span>
                    </li>
                    <li className="flex items-start gap-3 group/item">
                      <div className="h-6 w-6 rounded-full bg-polkadot-cyan/10 text-polkadot-cyan flex items-center justify-center mt-0.5 group-hover/item:bg-polkadot-cyan/20 transition-all duration-300">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-300">Compound or claim rewards</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </BeamsBackground>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="relative overflow-hidden my-0">
        <BeamsBackground intensity="subtle" className="">
          <div className="container mx-auto px-4 md:px-6 py-20 relative z-10">
            <div className="text-center mb-16">
              <div className="relative mx-auto max-w-max mb-6">
                <span className="absolute inset-0 rounded-full blur-md bg-polkadot-pink/20"></span>
                <span className="relative block rounded-full bg-polkadot-pink/20 px-4 py-1.5 text-sm font-semibold text-polkadot-pink tracking-wide">
                  <LineChart className="inline-block h-4 w-4 mr-2" />WHY CHOOSE US
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 heading tracking-tight">
                <span className="bg-gradient-to-r from-polkadot-pink via-polkadot-purple to-polkadot-cyan bg-clip-text text-transparent">Why Choose OrbitYield?</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                Built on Polkadot's powerful interoperability framework, OrbitYield offers unique advantages for DeFi users seeking optimal returns across multiple chains.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-pink/50 hover:shadow-lg hover:shadow-polkadot-pink/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-pink/10 rounded-full blur-xl group-hover:bg-polkadot-pink/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-polkadot-pink/10 flex items-center justify-center mb-6 group-hover:bg-polkadot-pink/20 transition-all duration-300">
                    <CircleDollarSign className="h-6 w-6 text-polkadot-pink" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-pink group-hover:translate-x-1 transition-all duration-300">Higher Returns</h3>
                  <p className="text-muted-foreground mb-4">
                    Our AI-driven auto-rebalancing system constantly monitors yield opportunities across multiple chains to maximize your returns.
                  </p>
                  <div className="flex items-center text-sm font-semibold text-polkadot-pink">
                    <span className="mr-2">Up to 25% APY</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-purple/50 hover:shadow-lg hover:shadow-polkadot-purple/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-purple/10 rounded-full blur-xl group-hover:bg-polkadot-purple/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-polkadot-purple/10 flex items-center justify-center mb-6 group-hover:bg-polkadot-purple/20 transition-all duration-300">
                    <Shield className="h-6 w-6 text-polkadot-purple" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-purple group-hover:translate-x-1 transition-all duration-300">Enhanced Security</h3>
                  <p className="text-muted-foreground mb-4">
                    Our sophisticated risk assessment system ensures your assets are allocated only to protocols with proven security track records.
                  </p>
                  <div className="flex items-center text-sm font-semibold text-polkadot-purple">
                    <span className="mr-2">Industry-leading protocols</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 transition-all duration-300 hover:border-polkadot-cyan/50 hover:shadow-lg hover:shadow-polkadot-cyan/10">
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-polkadot-cyan/10 rounded-full blur-xl group-hover:bg-polkadot-cyan/20 transition-all duration-500"></div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-polkadot-cyan/10 flex items-center justify-center mb-6 group-hover:bg-polkadot-cyan/20 transition-all duration-300">
                    <ArrowRightLeft className="h-6 w-6 text-polkadot-cyan" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 heading text-polkadot-cyan group-hover:translate-x-1 transition-all duration-300">Cross-Chain Ease</h3>
                  <p className="text-muted-foreground mb-4">
                    Seamlessly manage assets across multiple blockchains without the complexity of bridging or managing separate DeFi platforms.
                  </p>
                  <div className="flex items-center text-sm font-semibold text-polkadot-cyan">
                    <span className="mr-2">Multiple blockchains</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -z-10 rounded-full w-72 h-72 bg-polkadot-pink/5 blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-polkadot-pink/5 via-polkadot-purple/5 to-polkadot-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h3 className="text-2xl font-bold mb-6 heading">Core Advantages</h3>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4 group">
                      <div className="h-8 w-8 rounded-full bg-polkadot-pink/10 text-polkadot-pink flex items-center justify-center mt-1 group-hover:bg-polkadot-pink/20 transition-all duration-300">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 group-hover:text-polkadot-pink transition-colors duration-300">Seamless Cross-Chain Experience</h4>
                        <p className="text-muted-foreground">
                          No need to manually bridge assets or monitor multiple DeFi platforms across different chains.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="h-8 w-8 rounded-full bg-polkadot-purple/10 text-polkadot-purple flex items-center justify-center mt-1 group-hover:bg-polkadot-purple/20 transition-all duration-300">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 group-hover:text-polkadot-purple transition-colors duration-300">Lower Transaction Costs</h4>
                        <p className="text-muted-foreground">
                          Leverage Polkadot's scalable architecture to minimize gas fees and transaction costs.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-4 group">
                      <div className="h-8 w-8 rounded-full bg-polkadot-cyan/10 text-polkadot-cyan flex items-center justify-center mt-1 group-hover:bg-polkadot-cyan/20 transition-all duration-300">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-1 group-hover:text-polkadot-cyan transition-colors duration-300">Enhanced Security Model</h4>
                        <p className="text-muted-foreground">
                          Built with Polkadot's robust security framework, ensuring your assets are protected across all chains.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative mx-auto lg:mx-0 max-w-md">
                  <div className="absolute -z-10 -inset-0.5 bg-gradient-to-r from-polkadot-pink via-polkadot-purple to-polkadot-cyan rounded-xl blur-sm opacity-50"></div>
                  <div className="relative bg-background rounded-xl overflow-hidden">
                    <div className="aspect-video w-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="max-w-[80%] bg-card rounded-xl p-6 shadow-lg border border-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-3 w-3 rounded-full bg-polkadot-pink"></div>
                          <div className="h-3 w-3 rounded-full bg-background"></div>
                          <div className="h-3 w-3 rounded-full bg-background"></div>
                        </div>
                        <div className="space-y-4">
                          <div className="h-6 w-32 bg-border/50 rounded-md"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-full bg-border/30 rounded-sm"></div>
                            <div className="h-4 w-full bg-border/30 rounded-sm"></div>
                            <div className="h-4 w-2/3 bg-border/30 rounded-sm"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-16 bg-polkadot-pink/10 rounded-lg border border-polkadot-pink/20 flex items-center justify-center">
                              <div className="h-6 w-16 bg-polkadot-pink/30 rounded-md"></div>
                            </div>
                            <div className="h-16 bg-polkadot-purple/10 rounded-lg border border-polkadot-purple/20 flex items-center justify-center">
                              <div className="h-6 w-16 bg-polkadot-purple/30 rounded-md"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-50"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h4 className="heading text-xl font-bold mb-2">Intuitive Dashboard</h4>
                      <p className="text-sm text-muted-foreground mb-4">Monitor your investments across all chains in one unified interface</p>
                      <div className="flex items-center">
                        <Link href="/dashboard" className="text-sm font-medium text-polkadot-pink hover:text-polkadot-pink/80 transition-colors">
                          Explore Dashboard
                        </Link>
                        <ArrowRight className="ml-2 h-4 w-4 text-polkadot-pink" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BeamsBackground>
      </section>

      {/* Trusted Partners Section */}
      <section className="relative overflow-hidden my-0 bg-gradient-to-b from-black/90 to-background">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
        <DotPattern width={15} height={15} cx={7.5} cy={7.5} cr={1} className="opacity-5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-polkadot-purple/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-polkadot-purple/20 to-transparent"></div>
        <TrustedPartners />
      </section>

      {/* Founders Section */}
      <section className="relative overflow-hidden my-0 bg-gradient-to-b from-background to-black/90">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]"></div>
        <DotPattern width={15} height={15} cx={7.5} cy={7.5} cr={1} className="opacity-5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-polkadot-purple/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-polkadot-purple/20 to-transparent"></div>
        <FoundersSection />
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden my-0">
        <div className="absolute inset-0 bg-gradient-to-br from-polkadot-pink via-polkadot-purple to-polkadot-cyan"></div>
        <DotPattern width={15} height={15} cx={7.5} cy={7.5} cr={1} className="opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-1/2 h-32 bg-polkadot-pink/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-1/2 h-32 bg-polkadot-purple/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-48 bg-polkadot-cyan/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 py-20 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="relative mx-auto backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 md:p-14 overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-polkadot-pink/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-polkadot-cyan/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
              
              {/* Corner dots */}
              <div className="absolute -left-2 -top-2 h-5 w-5 bg-polkadot-pink text-white rounded-full shadow-lg shadow-polkadot-pink/50"></div>
              <div className="absolute -bottom-2 -left-2 h-5 w-5 bg-polkadot-pink text-white rounded-full shadow-lg shadow-polkadot-pink/50"></div>
              <div className="absolute -right-2 -top-2 h-5 w-5 bg-polkadot-pink text-white rounded-full shadow-lg shadow-polkadot-pink/50"></div>
              <div className="absolute -bottom-2 -right-2 h-5 w-5 bg-polkadot-pink text-white rounded-full shadow-lg shadow-polkadot-pink/50"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-center text-white drop-shadow-md">
                  Ready to Maximize Your DeFi Returns?
                </h2>
                <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-white/90 text-center font-medium">
                  Join thousands of users who are already benefiting from OrbitYield's cross-chain yield optimization.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/dashboard">
                    <Button className="w-full sm:w-auto rounded-full bg-white hover:bg-white/90 text-polkadot-pink hover:scale-105 transition-all duration-300 px-10 py-7 text-lg font-semibold shadow-lg shadow-black/20 group">
                      Launch App
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-white/70" />
                    <span className="text-white/70 text-sm">Secure & Audited</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-white/70" />
                    <span className="text-white/70 text-sm">5000+ Active Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-white/70" />
                    <span className="text-white/70 text-sm">$10M+ TVL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1A1A1A] bg-gradient-to-b from-black/90 to-black py-12">
        <DotPattern width={30} height={30} cx={15} cy={15} cr={0.8} className="opacity-5" />
        <div className="absolute bottom-0 right-0 w-1/3 h-40 bg-polkadot-purple/5 rounded-full blur-[80px]"></div>
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="/Original-Logo.svg" 
                    alt="OrbitYield" 
                    width={160} 
                    height={40} 
                    className="h-10 w-auto"
                  />
                </Link>
              </div>
              <p className="text-sm text-muted-foreground">
                A cross-chain yield optimizer built on Polkadot, maximizing your DeFi returns across multiple blockchains.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Yield Farms
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Risk Analysis
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Twitter
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Discord
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    Telegram
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-polkadot-pink transition-colors">
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <div className="flex justify-center space-x-4 mb-4">
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border hover:border-polkadot-pink hover:text-polkadot-pink transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </div>
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border hover:border-polkadot-pink hover:text-polkadot-pink transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
              </div>
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border hover:border-polkadot-pink hover:text-polkadot-pink transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><circle cx="17.5" cy="6.5" r="1.5"></circle></svg>
              </div>
              <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border hover:border-polkadot-pink hover:text-polkadot-pink transition-colors cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12"></path><path d="M4 14h9"></path><path d="M4 18h9"></path><path d="M18 15v-2"></path><path d="M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path><path d="M21 10a2 2, 0 0 1-2 2h-2a2 2 0 0 1-2-2"></path><path d="M21 6v8a5 5 0 0 1-5 5H4"></path></svg>
              </div>
            </div>
            <p> 2025 OrbitYield. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
