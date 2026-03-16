import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "../components/landing/Navbar";
import { colors } from "@/styles/colors";
import {
  FileText,
  Zap,
  Shield,
  CheckCircle2,
  Users,
  ArrowRight,
  Sparkles,
  Clock,
  DollarSign,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: "Just Talk!",
      description:
        "Write your template once, then generate all your reports by talking. No typing, no formatting—just speak and done.",
    },
    {
      icon: FileText,
      title: "Works with any .docx template",
      description:
        "Bring your own templates or use ours. Flow Swift adapts to your existing workflows seamlessly.",
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description:
        "Generate comprehensive reports in minutes, not hours. Spend more time on what matters most.",
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security ensures your data is protected. Trusted by industry professionals.",
    },
  ];

  const industries = [
    "General Contractors",
    "Sub-Contractors",
    "Construction Inspectors",
    "Project Managers",
    "Site Supervisors",
    "Safety Officers",
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "15",
      description: "Perfect for individual professionals",
      features: ["50 reports/month", "2 custom templates", "Email support"],
    },
    {
      name: "Professional",
      price: "50",
      description: "Best for growing teams",
      features: [
        "1000 reports/month",
        "10 custom templates",
        "Advanced AI features",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited reports",
        "Unlimited custom templates",
        "Team collaboration",
        "Custom integrations",
      ],
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.cream, color: colors.text.primary }}>
      <Navbar />
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" style={{ color: colors.text.primary }}>
              AI-Powered Reports That Write Themselves
            </h1>

            <p className="text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: colors.text.secondary }}>
              Transform your voice notes into professional .docx reports
              instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/register")}
                className="text-white px-8 py-6 text-lg shadow-xl group"
                style={{
                  backgroundColor: colors.primary.main,
                  boxShadow: `0 8px 24px ${colors.primary.main}40`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary.main}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="px-8 py-6 text-lg"
                style={{
                  borderColor: colors.ui.borderLight,
                  backgroundColor: colors.background.white,
                  color: colors.text.primary,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.background.hover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.background.white}
              >
                Login
              </Button>
            </div>

            <p className="text-sm mt-6" style={{ color: colors.text.tertiary }}>
              No credit card required • Start in minutes
            </p>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: colors.background.white }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
              Why Choose Flow Swift?
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: colors.text.secondary }}>
              Simple, flexible, and adapts to your needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="backdrop-blur-sm rounded-xl p-6 transition-all"
                style={{
                  backgroundColor: colors.background.hover,
                  border: `1px solid ${colors.ui.borderLight}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary.main;
                  e.currentTarget.style.boxShadow = `0 8px 16px ${colors.primary.main}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.ui.borderLight;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary.main }}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                  {feature.title}
                </h3>
                <p style={{ color: colors.text.secondary }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
              Trusted by Industry Professionals
            </h2>
            <p className="text-xl" style={{ color: colors.text.secondary }}>
              From construction sites to corporate offices, professionals rely
              on Flow Swift
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="rounded-lg p-6 flex items-center gap-3"
                style={{
                  backgroundColor: colors.background.white,
                  border: `1px solid ${colors.ui.borderLight}`,
                }}
              >
                <CheckCircle2 className="h-6 w-6 flex-shrink-0" style={{ color: colors.primary.main }} />
                <span className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  {industry}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: colors.background.white }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl" style={{ color: colors.text.secondary }}>
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: colors.background.hover,
                  border: plan.popular
                    ? `2px solid ${colors.primary.main}`
                    : `1px solid ${colors.ui.borderLight}`,
                  boxShadow: plan.popular
                    ? `0 8px 24px ${colors.primary.main}30`
                    : 'none',
                  transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {plan.popular && (
                  <div
                    className="text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4"
                    style={{ backgroundColor: colors.primary.main }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
                  {plan.name}
                </h3>
                <p className="mb-6" style={{ color: colors.text.secondary }}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  {plan.price === "Custom" ? (
                    <div className="text-4xl font-bold" style={{ color: colors.text.primary }}>
                      Custom
                    </div>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold" style={{ color: colors.text.primary }}>
                        ${plan.price}
                      </span>
                      <span className="ml-2" style={{ color: colors.text.secondary }}>
                        /month
                      </span>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2
                        className="h-5 w-5 flex-shrink-0 mt-0.5"
                        style={{ color: colors.primary.main }}
                      />
                      <span style={{ color: colors.text.primary }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate("/register")}
                  className="w-full text-white shadow-lg"
                  style={{
                    backgroundColor: plan.popular ? colors.primary.main : colors.text.secondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = plan.popular
                      ? colors.primary.hover
                      : colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = plan.popular
                      ? colors.primary.main
                      : colors.text.secondary;
                  }}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
              Get in Touch
            </h2>
            <p className="text-xl" style={{ color: colors.text.secondary }}>
              Have questions? We're here to help
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div
              className="rounded-xl p-6 text-center"
              style={{
                backgroundColor: colors.background.white,
                border: `1px solid ${colors.ui.borderLight}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.primary.main }}
              >
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                Email Us
              </h3>
              <a
                href="mailto:support@flowswift.com"
                className="transition-colors"
                style={{ color: colors.primary.main }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.primary.main}
              >
                support@flowswift.com
              </a>
            </div>

            <div
              className="rounded-xl p-6 text-center"
              style={{
                backgroundColor: colors.background.white,
                border: `1px solid ${colors.ui.borderLight}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: colors.primary.main }}
              >
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
                Call Us
              </h3>
              <a
                href="tel:+1-555-123-4567"
                className="transition-colors"
                style={{ color: colors.primary.main }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.primary.hover}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.primary.main}
              >
                +1 (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer
        className="py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundColor: colors.sidebar.dark,
          borderTop: `1px solid ${colors.sidebar.hover}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.primary.main }}
                >
                  <span className="text-white font-bold text-xl">FS</span>
                </div>
                <span className="text-white font-bold text-xl">Flow Swift</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Streamline your reporting with AI-powered intelligence. Trusted
                by professionals world-wide.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Templates
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="pt-8 text-center text-sm"
            style={{
              borderTop: `1px solid ${colors.sidebar.hover}`,
              color: 'rgb(156, 163, 175)',
            }}
          >
            <p>
              &copy; {new Date().getFullYear()} Flow Swift. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
