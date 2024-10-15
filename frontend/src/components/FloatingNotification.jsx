import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

const FloatingNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    // Play default notification sound
    playNotificationSound();
  }, []);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden animate-slide-up">
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Bell className="h-6 w-6 text-blue-400" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-100">{notification.title}</p>
            <p className="mt-1 text-sm text-gray-300">{notification.body}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-200"
              onClick={() => {
                setIsVisible(false);
                onClose();
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingNotification;