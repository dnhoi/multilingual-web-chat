import React from 'react';
import { BarChart2, X } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

const PollModal = ({
  showPollModal,
  setShowPollModal,
  pollQuestion,
  setPollQuestion,
  pollOptions,
  setPollOptions,
  onSendMessage
}) => {
  const { showToast } = useToast();

  if (!showPollModal) return null;

  const handleSendPoll = () => {
    const validOptions = pollOptions.filter(o => o.trim());
    if (!pollQuestion.trim() || validOptions.length < 2) {
      showToast('Cần nhập câu hỏi và ít nhất 2 lựa chọn!', 'error');
      return;
    }
    const pollData = {
      question: pollQuestion.trim(),
      options: validOptions.map(text => ({ text, votes: 0 }))
    };
    onSendMessage(JSON.stringify(pollData), [], { messageType: 'POLL' });
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPollModal(false)}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Tạo bình chọn (Poll)</h3>
          </div>
          <button onClick={() => setShowPollModal(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            placeholder="Câu hỏi bình chọn..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="space-y-2">
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                <input
                  type="text"
                  value={opt}
                  onChange={e => { const o = [...pollOptions]; o[i] = e.target.value; setPollOptions(o); }}
                  placeholder={`Lựa chọn ${i + 1}`}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {pollOptions.length > 2 && (
                  <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
          {pollOptions.length < 6 && (
            <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-sm text-blue-500 hover:text-blue-700 flex items-center space-x-1">
              <span>+ Thêm lựa chọn</span>
            </button>
          )}
        </div>
        <div className="flex space-x-3 mt-4">
          <button onClick={() => setShowPollModal(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400">Hủy</button>
          <button onClick={handleSendPoll} className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium">Gửi bình chọn</button>
        </div>
      </div>
    </div>
  );
};

export default PollModal;
