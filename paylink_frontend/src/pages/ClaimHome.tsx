import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const claimCodeSchema = z.object({
  claimCode: z.string()
    .min(1, "Claim code is required")
    .regex(/^[a-zA-Z0-9]+$/, "Claim code must contain only letters and numbers"),
});

type ClaimCodeFormData = z.infer<typeof claimCodeSchema>;

export default function ClaimHome() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClaimCodeFormData>({
    resolver: zodResolver(claimCodeSchema),
  });

  const onSubmit = async (data: ClaimCodeFormData) => {
    setIsSubmitting(true);
    try {
      navigate(`/claim/${data.claimCode.trim()}`);
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "3rem", maxWidth: "36rem" }}>
      <div className="card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Claim Your Payment
          </h1>
          <p className="muted" style={{ fontSize: "1rem" }}>
            Enter your claim code to receive your payment
          </p>
        </div>

        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginBottom: "2rem" 
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary), var(--primary-600))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
          }}>
            💰
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label 
              htmlFor="claimCode" 
              style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: 600,
                fontSize: "0.95rem"
              }}
            >
              Claim Code
            </label>
            <input
              id="claimCode"
              type="text"
              className="input"
              placeholder="e.g. cd9e84010c0c"
              {...register("claimCode")}
              disabled={isSubmitting}
              autoFocus
              style={{ 
                textAlign: "center",
                fontSize: "1.1rem",
                letterSpacing: "0.05em",
                fontFamily: "monospace"
              }}
            />
            {errors.claimCode && (
              <p style={{ 
                color: "#ef4444", 
                fontSize: "0.875rem", 
                marginTop: "0.5rem",
                textAlign: "center"
              }}>
                {errors.claimCode.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              width: "100%",
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "1rem",
              padding: "0.75rem 1rem"
            }}
          >
            {isSubmitting ? "Loading..." : "Continue to Claim"}
          </button>
        </form>

        <div className="spacer-lg"></div>

        {/* Info Section */}
        <div style={{ 
          padding: "1rem", 
          background: "rgba(255, 255, 255, 0.02)", 
          borderRadius: "8px",
          border: "1px solid var(--border)"
        }}>
          <h3 style={{ 
            fontSize: "0.9rem", 
            fontWeight: 600, 
            marginBottom: "0.75rem",
            color: "var(--text)"
          }}>
            ℹ️ What is a claim code?
          </h3>
          <p className="muted" style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
            A claim code is a unique identifier provided by the sender that allows you to receive your payment. 
            If you received a payment link, you can find the claim code in the URL or in the message from the sender.
          </p>
        </div>

        <div className="spacer-md"></div>

        {/* Help Text */}
        <div style={{ textAlign: "center" }}>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Don't have a claim code?{" "}
            <a href="/" style={{ color: "var(--primary)", fontWeight: 600 }}>
              Go back home
            </a>
          </p>
        </div>
      </div>

      {/* Additional Features Section */}
      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              fontSize: "1.5rem",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34, 199, 108, 0.15)",
              borderRadius: "8px"
            }}>
              🔒
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Secure & Private
              </h4>
              <p className="muted" style={{ fontSize: "0.8rem" }}>
                Your payment is protected on the blockchain
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              fontSize: "1.5rem",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34, 199, 108, 0.15)",
              borderRadius: "8px"
            }}>
              ⚡
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Instant Access
              </h4>
              <p className="muted" style={{ fontSize: "0.8rem" }}>
                Claim your funds immediately with just a code
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              fontSize: "1.5rem",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34, 199, 108, 0.15)",
              borderRadius: "8px"
            }}>
              🌐
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                Global Payments
              </h4>
              <p className="muted" style={{ fontSize: "0.8rem" }}>
                Receive payments from anywhere in the world
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}