import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Smartphone,
  Key,
  Download,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
} from "lucide-react";
import Image from "next/image";

interface MFASetupProps {
  userId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface MFADevice {
  id: string;
  type: "totp" | "sms";
  name: string;
  verified: boolean;
  createdAt: string;
}

interface TOTPSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function MFASetup({
  userId,
  onComplete,
  onCancel,
}: MFASetupProps) {
  const [step, setStep] = useState<
    | "choose"
    | "totp-setup"
    | "sms-setup"
    | "verify"
    | "backup-codes"
    | "complete"
  >("choose");
  const [selectedMethod, setSelectedMethod] = useState<"totp" | "sms" | null>(
    null,
  );
  const [totpSetup, setTotpSetup] = useState<TOTPSetup | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [existingDevices, setExistingDevices] = useState<MFADevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadExistingDevices = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/security/mfa/devices?userId=${userId}`,
      );
      if (response.ok) {
        const devices = await response.json();
        setExistingDevices(devices);
      }
    } catch (error) {
      console.error("Error loading MFA devices:", error);
    }
  }, [userId]);

  useEffect(() => {
    loadExistingDevices();
  }, [userId, loadExistingDevices]);

  const startTOTPSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/security/mfa/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const setup = await response.json();
        setTotpSetup(setup);
        setStep("totp-setup");
      } else {
        const error = await response.json();
        setError(error.message || "Failed to setup TOTP");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const startSMSSetup = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/security/mfa/sms/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phoneNumber }),
      });

      if (response.ok) {
        setStep("verify");
      } else {
        const error = await response.json();
        setError(error.message || "Failed to setup SMS");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint =
        selectedMethod === "totp"
          ? "/api/security/mfa/totp/verify"
          : "/api/security/mfa/sms/verify";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          ...(selectedMethod === "totp" && { secret: totpSetup?.secret }),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.backupCodes) {
          setBackupCodes(result.backupCodes);
          setStep("backup-codes");
        } else {
          setStep("complete");
        }
      } else {
        const error = await response.json();
        setError(error.message || "Invalid verification code");
      }
    } catch (error) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/security/mfa/devices/${deviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExistingDevices((devices) =>
          devices.filter((d) => d.id !== deviceId),
        );
      }
    } catch (error) {
      console.error("Error removing device:", error);
    }
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Multi-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Add an extra layer of security to your account
        </p>
      </div>

      {existingDevices.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Existing MFA Devices
          </h3>
          <div className="space-y-2">
            {existingDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="flex items-center space-x-3">
                  {device.type === "totp" ? (
                    <Key className="h-5 w-5 text-green-600" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-500">
                      {device.type.toUpperCase()} •{" "}
                      {device.verified ? "Verified" : "Pending"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDevice(device.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => {
            setSelectedMethod("totp");
            startTOTPSetup();
          }}
          disabled={loading}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <Key className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">
            Authenticator App
          </h3>
          <p className="text-sm text-gray-600">
            Use Google Authenticator, Authy, or similar apps
          </p>
          <p className="text-xs text-green-600 mt-2">Recommended</p>
        </button>

        <button
          onClick={() => {
            setSelectedMethod("sms");
            setStep("sms-setup");
          }}
          disabled={loading}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
        >
          <Smartphone className="h-8 w-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">SMS Text Message</h3>
          <p className="text-sm text-gray-600">
            Receive codes via text message
          </p>
          <p className="text-xs text-yellow-600 mt-2">Less secure</p>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  const renderTOTPSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up Authenticator App
        </h2>
        <p className="text-gray-600">
          Scan the QR code with your authenticator app
        </p>
      </div>

      {totpSetup && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="mb-4">
              <Image
                src={totpSetup.qrCode}
                alt="QR Code"
                width={192}
                height={192}
                className="mx-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Can't scan the QR code? Enter this secret key manually:
            </p>
            <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
              {totpSetup.secret}
              <button
                onClick={() => copyToClipboard(totpSetup.secret)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                {copiedCode === totpSetup.secret ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter the 6-digit code from your authenticator app
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder="000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
              maxLength={6}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep("choose")}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={verifyCode}
          disabled={loading || verificationCode.length !== 6}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
      </div>
    </div>
  );

  const renderSMSSetup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Set Up SMS Authentication
        </h2>
        <p className="text-gray-600">
          Enter your phone number to receive verification codes
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include country code (e.g., +1 for US)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setStep("choose")}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={startSMSSetup}
          disabled={loading || !phoneNumber.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Verification Code"}
        </button>
      </div>
    </div>
  );

  const renderVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Smartphone className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Enter Verification Code
        </h2>
        <p className="text-gray-600">
          {selectedMethod === "sms"
            ? `We sent a code to ${phoneNumber}`
            : "Enter the code from your authenticator app"}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) =>
            setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
          maxLength={6}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() =>
            setStep(selectedMethod === "totp" ? "totp-setup" : "sms-setup")
          }
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={verifyCode}
          disabled={loading || verificationCode.length !== 6}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
      </div>
    </div>
  );

  const renderBackupCodes = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Save Your Backup Codes
        </h2>
        <p className="text-gray-600">
          Store these codes in a safe place. You can use them to access your
          account if you lose your device.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">Important:</p>
            <p className="text-yellow-700 text-sm">
              Each backup code can only be used once. Keep them secure and don't
              share them with anyone.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {backupCodes.map((code, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-2 rounded border"
            >
              <span>{code}</span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-blue-600 hover:text-blue-800"
              >
                {copiedCode === code ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={downloadBackupCodes}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <Download className="h-4 w-4" />
          <span>Download Codes</span>
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setStep("complete")}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          MFA Setup Complete!
        </h2>
        <p className="text-gray-600">
          Your account is now protected with multi-factor authentication.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm">
          You'll now be prompted for a verification code when signing in from
          new devices or locations.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onComplete}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      {step === "choose" && renderChooseMethod()}
      {step === "totp-setup" && renderTOTPSetup()}
      {step === "sms-setup" && renderSMSSetup()}
      {step === "verify" && renderVerify()}
      {step === "backup-codes" && renderBackupCodes()}
      {step === "complete" && renderComplete()}
    </div>
  );
}
