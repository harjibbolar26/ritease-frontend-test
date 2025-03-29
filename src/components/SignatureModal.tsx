// SignatureModal.tsx
import React from "react";
import ReactSignatureCanvas from "react-signature-canvas";

interface SignatureModalProps {
    signatureCanvasRef: React.RefObject<ReactSignatureCanvas | null>;
    onSave: () => void;
    onClear: () => void;
    onCancel: () => void;
  }

const SignatureModal: React.FC<SignatureModalProps> = ({
  signatureCanvasRef,
  onSave,
  onClear,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl mb-4">Draw Your Signature</h2>
        <ReactSignatureCanvas
          ref={signatureCanvasRef}
          canvasProps={{
            width: 400,
            height: 200,
            className: "border-2 border-gray-300",
          }}
          clearOnResize={false}
        />
        <div className="flex justify-between mt-4">
          <button
            onClick={onClear}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear
          </button>
          <button
            onClick={onSave}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;