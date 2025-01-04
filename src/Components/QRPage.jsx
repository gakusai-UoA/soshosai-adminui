import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";

const QRPage = () => {
  const [qrError, setQrError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 300 },
        height: { ideal: 300 },
      },
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          scanQrCode();
        }
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    const currentVideoRef = videoRef.current;

    return () => {
      if (currentVideoRef && currentVideoRef.srcObject) {
        const stream = currentVideoRef.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const scanQrCode = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCodeData = jsQR(imageData.data, imageData.width, imageData.height);
        if (qrCodeData) {
          const qrText = qrCodeData.data;
          if (qrText.length === 37 && (qrText.startsWith("g") || qrText.startsWith("t"))) {
            if (qrText.startsWith("t")) {
              navigate(`/tickets?ticketid=${qrText}`);
            } else if (qrText.startsWith("g")) {
              navigate(`/groups?id=${qrText}`);
            }
          } else {
            setQrError("無効なQRコードです");
          }
          return;
        }
        setTimeout(scanQrCode, 100);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">QRコードスキャン</h1>
      <div className="flex justify-center mb-4">
        <div className="relative h-[300px] w-[300px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute left-0 top-0 -z-50 h-[300px] w-[300px]"
          />
          <canvas
            ref={canvasRef}
            width="300"
            height="300"
            className="absolute left-0 top-0"
          />
        </div>
      </div>
      {qrError && <p className="text-center text-xs text-red-500">{qrError}</p>}
    </div>
  );
};

export default QRPage;