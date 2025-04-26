import { motion } from 'framer-motion';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function Switch({ checked, onChange }: SwitchProps) {
    return (
        <motion.button
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
            onClick={() => onChange(!checked)}
            animate={{
                backgroundColor: checked ? 'rgb(79, 70, 229)' : 'rgb(229, 231, 235)',
            }}
            whileTap={{ scale: 0.95 }}
        >
            <span className="sr-only">Toggle setting</span>
            <motion.span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow"
                animate={{
                    x: checked ? '24px' : '2px',
                }}
                transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                }}
            />
        </motion.button>
    );
}
