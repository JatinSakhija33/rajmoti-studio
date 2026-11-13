import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowUpRight, Check, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

interface UpiQrCodeProps {
  upiUri: string;
  amountRupees: number;
  payeeVpa?: string;
  beneficiaryName?: string;
  orderRef?: string;
  className?: string;
}

export function UpiQrCode({
  upiUri,
  amountRupees,
  payeeVpa = "9429070317@apl",
  beneficiaryName = "PANKAJ LAXMICHAND SAKHIJA",
  orderRef,
  className = "",
}: UpiQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copiedVpa, setCopiedVpa] = useState(false);

  useEffect(() => {
    if (!upiUri) return;
    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 1.5,
      errorCorrectionLevel: "M",
      color: {
        dark: "#1c1917", // warm stone dark
        light: "#ffffff",
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error("Error generating UPI QR code:", err));
  }, [upiUri]);

  const copyVpa = () => {
    navigator.clipboard.writeText(payeeVpa);
    setCopiedVpa(true);
    toast.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-stone-200 bg-stone-50/70 p-5 text-center shadow-xs ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2">
        <QrCode size={16} className="text-amber-700" />
        <span>Official Studio UPI QR</span>
      </div>

      <div className="relative mx-auto my-3 inline-block rounded-xl border-2 border-stone-800 bg-white p-3 shadow-md">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`UPI Payment QR for ₹${amountRupees.toFixed(2)}`}
            className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain"
          />
        ) : (
          <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center text-xs text-stone-400">
            Generating Secure QR…
          </div>
        )}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-stone-900 text-amber-200 px-3 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wide shadow-sm whitespace-nowrap">
          Pay ₹{amountRupees.toFixed(2)}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-xs text-stone-600">
        <p className="font-semibold text-stone-900">
          Beneficiary: <span className="font-bold">{beneficiaryName}</span>
        </p>
        <div className="flex items-center justify-center gap-1 font-mono text-stone-700">
          <span>VPA: <strong>{payeeVpa}</strong></span>
          <button
            type="button"
            onClick={copyVpa}
            className="p-1 hover:text-stone-900 transition-colors"
            title="Copy UPI ID"
            aria-label="Copy UPI ID"
          >
            {copiedVpa ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        </div>
        {orderRef && (
          <p className="text-[11px] text-stone-500 font-mono">
            Reference: {orderRef}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
        <a
          href={upiUri}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors"
        >
          <span>Pay ₹{amountRupees.toFixed(2)} in UPI App</span>
          <ArrowUpRight size={14} />
        </a>
      </div>

      <p className="mt-3 text-[11px] text-stone-400 leading-relaxed">
        Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
      </p>
    </div>
  );
}
