import { useStore } from '../store/useStore';

export function NoteRefreshControl() {
    const { noteRefreshRate, setNoteRefreshRate } = useStore();

    return (
        <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between">
                <span className="text-sm font-medium">
                    Note Display Refresh Rate
                </span>
                <span className="text-sm text-gray-500">
                    {noteRefreshRate}ms
                </span>
            </label>
            <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={noteRefreshRate}
                onChange={(e) => setNoteRefreshRate(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500">
                <span>Fast</span>
                <span>Stable</span>
            </div>
        </div>
    );
}
