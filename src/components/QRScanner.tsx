import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                // Success callback
                onScanSuccess(decodedText);
                // Stop scanning after success
                scanner.clear().catch(console.error);
            },
            () => {
                // Error callback (called frequently when no QR found)
                // We generally ignore this unless it's a critical error
            }
        );

        return () => {
            // Cleanup
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] rounded-lg p-6 w-full max-w-md relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>
                <h3 className="text-xl font-bold mb-4 text-white">Scan LinkedIn QR</h3>
                <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
                <p className="text-sm text-gray-400 mt-4 text-center">
                    Point your camera at a LinkedIn QR code.
                </p>
            </div>
        </div>
    );
};
