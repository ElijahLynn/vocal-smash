import { useStore } from '../../store/store';

export function LeaderDirectionControl() {
    const { leaderDirection, setLeaderDirection } = useStore();

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Leader Direction</label>
            <div className="flex gap-2">
                <button
                    onClick={() => setLeaderDirection('ltr')}
                    className={`px-3 py-1 rounded-lg transition-colors ${leaderDirection === 'ltr'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    Left to Right
                </button>
                <button
                    onClick={() => setLeaderDirection('rtl')}
                    className={`px-3 py-1 rounded-lg transition-colors ${leaderDirection === 'rtl'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                >
                    Right to Left
                </button>
            </div>
        </div>
    );
}
