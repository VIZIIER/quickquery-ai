
import React from 'react';
import { GroundingSource } from '../types';
import { ExternalLinkIcon } from './Icons';

interface SourceCardProps {
  source: GroundingSource;
}

const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-blue-400 hover:shadow-md transition-all group"
    >
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-medium text-slate-800 truncate">{source.title}</h4>
        <p className="text-xs text-slate-500 truncate">{new URL(source.uri).hostname}</p>
      </div>
      <ExternalLinkIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
    </a>
  );
};

export default SourceCard;
