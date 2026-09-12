import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Navigation,
  Home,
  Compass,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
} from 'lucide-react';
import { useAuthStore, RoleName } from '../../store/authStore';

interface RoleCardData {
  role: RoleName;
  title: string;
  name: string;
  email: string;
  department: string;
  badge: string;
  badgeColor: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  description: string;
  destination: string;
  features: string[];
}

const ROLE_OPTIONS: RoleCardData[] = [
  {
    role: 'COUNCIL_OFFICER',
    title: 'Council Officer',
    name: 'Kasun Perera',
    email: 'kasun.officer@cmc.gov.lk',
    department: 'Colombo Municipal Council — Emergency Operations',
    badge: 'MUNICIPAL COMMAND',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: ShieldAlert,
    accentColor: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/30',
    description: 'Multi-ward hazard triage, 5-signal AI verification scorecards, proximity-based field crew dispatch, and road closure infrastructure.',
    destination: '/officer',
    features: ['5-Signal AI Verification', 'Haversine Crew Dispatch', 'Road Closure Controls'],
  },
  {
    role: 'FIELD_CREW',
    title: 'Field Crew Lead',
    name: 'Sunil Shantha',
    email: 'sunil.crew@cmc.gov.lk',
    department: 'Rapid Response Unit #04 — Field Operations',
    badge: 'FIELD RESPONSE',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Navigation,
    accentColor: 'border-blue-200 hover:border-blue-400 bg-blue-50/30',
    description: 'Mobile emergency terminal with real-time GPS beacon telematics, dynamic flood detours, offline queueing, and photo-verified road reopening.',
    destination: '/crew',
    features: ['Live GPS Telematics', 'Dynamic Detour Routing', 'Photo Proof Resolution'],
  },
  {
    role: 'RELIEF_COORDINATOR',
    title: 'Relief Coordinator',
    name: 'Anoma Wickramasinghe',
    email: 'anoma.relief@redcross.lk',
    department: 'Sri Lanka Red Cross — Humanitarian Logistics',
    badge: 'HUMANITARIAN RELIEF',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: Home,
    accentColor: 'border-teal-200 hover:border-teal-400 bg-teal-50/30',
    description: 'P1–P4 operational urgency SOS triage, shelter network bed capacity gauges, atomic family reservations, and emergency supplies allocation.',
    destination: '/relief',
    features: ['Live Bed Capacity Gauges', 'Household Headcount Matcher', 'Emergency Supplies Kits'],
  },
  {
    role: 'CITIZEN',
    title: 'Citizen & Public Safety',
    name: 'Nimal Silva',
    email: 'nimal.citizen@gmail.com',
    department: 'Civic Resilience & Community Watch',
    badge: 'PUBLIC ACCESS',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Compass,
    accentColor: 'border-rose-200 hover:border-rose-400 bg-rose-50/30',
    description: 'Public disaster hazard viewer with 100m–350m flood perimeters, closed road barrier overlays, GPS pin-drop hazard reporting, and safe detour routes.',
    destination: '/map',
    features: ['Verified Hazard Perimeters', 'Pin-Drop Hazard Reporting', 'Safe Evacuation Routes'],
  },
];

export const LoginPage: React.FC = () => {
  const { switchPersona, isLoading, user } = useAuthStore();
  const navigate = useNavigate();

  const handleSelectRole = async (card: RoleCardData) => {
    await switchPersona(card.role);
    navigate(card.destination);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* Header Title Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>CivicGuard Access Gateway</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Select Your Operational Role
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose a role below to launch the dedicated command center, field terminal, relief logistics desk, or public disaster map.
          </p>
        </div>

        {/* 4 Interactive Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ROLE_OPTIONS.map((card) => {
            const Icon = card.icon;
            const isCurrent = user?.role === card.role;

            return (
              <div
                key={card.role}
                onClick={() => !isLoading && handleSelectRole(card)}
                className={`glass-panel p-6 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between group ${card.accentColor} ${
                  isCurrent ? 'ring-2 ring-emerald-500 shadow-md' : ''
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badges & Icon */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white shadow-xs border border-slate-200 text-slate-800 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6 text-slate-800" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900">{card.title}</h2>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-600">{card.name}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    {card.email} • {card.department}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Feature Checkpoints */}
                  <div className="space-y-1 pt-1">
                    {card.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="pt-5 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                    Sign in & launch workspace
                  </span>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all group-hover:translate-x-0.5"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informational Footer Note */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>CivicGuard Municipal Disaster Response & Resilience Infrastructure</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Kong API Gateway : 8000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
