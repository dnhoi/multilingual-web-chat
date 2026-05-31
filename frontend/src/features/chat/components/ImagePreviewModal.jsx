const ImagePreviewModal = ({ selectedImage, setSelectedImage }) => {
  if (!selectedImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={() => setSelectedImage(null)}
    >
      <button
        onClick={() => setSelectedImage(null)}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-3 rounded-full hover:bg-white/20 z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex items-center justify-center w-full h-full p-4" onClick={(e) => e.stopPropagation()}>
        <img
          src={selectedImage}
          alt=""
          className="max-w-full max-h-full object-contain rounded-lg"
          style={{ maxWidth: '95vw', maxHeight: '95vh' }}
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal;
