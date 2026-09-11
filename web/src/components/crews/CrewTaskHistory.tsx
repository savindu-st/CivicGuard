import React from 'react';
import { CheckCircle, Clock, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface TaskHistoryProps {
  tasks: any[];
}

export const CrewTaskHistory: React.FC<TaskHistoryProps> = ({ tasks }) => {
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CLOSED');

  if (completedTasks.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
        No completed tasks logged for this shift yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {completedTasks.map((ticket) => {
        const evidence = ticket.incidents?.incident_evidence?.find(
          (e: any) => e.evidence_type === 'COMPLETION_PHOTO'
        );

        return (
          <div
            key={ticket.id}
            className="p-4 bg-dark-900/60 border border-slate-800/80 rounded-xl space-y-2.5 transition-all hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="badge-success text-[11px]">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> COMPLETED & VERIFIED
              </span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ticket.completed_at ? new Date(ticket.completed_at).toLocaleTimeString() : 'Recent'}
              </span>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-white">
                {ticket.incidents?.incident_type?.replace(/_/g, ' ') || 'Hazard Clearance'}
              </h5>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                {ticket.incidents?.roads?.name || 'Road Segment'}, {ticket.incidents?.wards?.name || 'Ward'}
              </p>
            </div>

            {ticket.description && (
              <p className="text-[11px] text-slate-300 italic bg-dark-950/60 p-2 rounded border border-slate-800/60">
                "{ticket.description}"
              </p>
            )}

            {evidence && (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-700 bg-dark-950 flex-shrink-0">
                  <img
                    src={evidence.file_url}
                    alt="Resolution Proof"
                    className="w-full h-full object-cover"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <ImageIcon className="w-4 h-4 text-slate-600 absolute inset-0 m-auto -z-10" />
                </div>
                <div className="text-[11px]">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    Photo Proof Attached <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                  <p className="text-[10px] text-slate-500">Public map reopened based on this evidence</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
