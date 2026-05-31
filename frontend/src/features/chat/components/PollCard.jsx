import { BarChart2 } from 'lucide-react';

const PollCard = ({ message, handleVote, currentUser }) => {
  let pollData = null;
  try { pollData = JSON.parse(message.originalText || '{}'); } catch { return null; }
  if (!pollData?.question) return null;

  const options = pollData.options || [];
  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
  const userId = currentUser?.id || currentUser?.userId || currentUser?.username;

  return (
    <div className="min-w-[220px] max-w-xs">
      {/* Poll header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
          {pollData.question}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((opt, i) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes || 0) * 100 / totalVotes) : 0;
          const isVoted = (opt.voters || []).some(
            v => String(v).toLowerCase() === String(userId || '').toLowerCase()
          );
          return (
            <div
              key={i}
              className="relative cursor-pointer group rounded-lg overflow-hidden"
              onClick={() => handleVote(message, i)}
            >
              {/* Progress bar */}
              <div
                className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-500 ${
                  isVoted
                    ? 'bg-blue-200 dark:bg-blue-700/50'
                    : 'bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/35'
                }`}
                style={{ width: `${pct}%` }}
              />

              {/* Label row */}
              <div className={`relative flex items-center justify-between gap-2 text-xs px-3 py-2.5 rounded-lg border transition-colors ${
                isVoted
                  ? 'border-blue-400 dark:border-blue-500'
                  : 'border-zinc-200 dark:border-zinc-700 group-hover:border-blue-200 dark:group-hover:border-blue-800'
              }`}>
                <span className={`font-medium ${isVoted ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {opt.text}
                </span>
                <span className={`tabular-nums font-semibold flex-shrink-0 ${
                  isVoted ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'
                }`}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2.5 text-right font-medium">
        {totalVotes} lượt bình chọn
      </p>
    </div>
  );
};

export default PollCard;
