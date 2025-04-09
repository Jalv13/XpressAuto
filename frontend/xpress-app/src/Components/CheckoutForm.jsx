// CheckoutForm.jsx
import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Define the CheckoutForm component
function CheckoutForm({ onPaymentSuccess }) {
  // Accept the callback prop
  // Get access to the Stripe and Elements instances via hooks
  const stripe = useStripe();
  const elements = useElements();

  // State variables for managing the payment process within this form
  const [paymentMessage, setPaymentMessage] = useState(null); // To display success/error messages from Stripe
  const [isProcessing, setIsProcessing] = useState(false); // To disable the form while payment is processing

  // --- Handle Form Submission ---
  const handleSubmit = async (event) => {
    // Prevent the default form submission behavior (which would cause a page refresh)
    event.preventDefault();

    // Check if Stripe.js or Elements have loaded yet.
    // If not, disable form submission until they are ready.
    if (!stripe || !elements) {
      console.log("Stripe.js or Elements not yet loaded.");
      return;
    }

    // Indicate that processing has started and clear any previous messages
    setIsProcessing(true);
    setPaymentMessage(null);

    console.log("Attempting to confirm payment...");

    // Trigger the payment confirmation flow using the Payment Element.
    // stripe.confirmPayment will collect information from the Payment Element,
    // securely confirm the payment with Stripe using the clientSecret
    // (provided earlier via the <Elements> options), and potentially handle
    // authentication steps (like 3D Secure) if required by the bank.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements, // Pass the Elements instance containing the PaymentElement data
      confirmParams: {
        // Optional: Specify a return URL. While redirect: 'if_required' often avoids
        // a full redirect, providing this can be a fallback or useful for certain flows.
        // Using the current page URL is common for SPA modals.
        return_url: `${window.location.origin}/payment-complete`, // Or just window.location.href
      },
      // CRUCIAL: Use 'if_required' to handle SCA redirects within the modal
      // or iframe if possible, returning the result directly if no redirect is needed.
      redirect: "if_required",
    });

    // --- Handle the Result ---
    if (error) {
      // This point is reached if there is an immediate error when confirming the payment.
      // This could be due to validation errors (e.g., incomplete CVC) or card errors (e.g., declined).
      console.error("Payment confirmation error:", error);
      // Show error message to your customer (e.g., error.message)
      setPaymentMessage(
        error.message || "An unexpected payment error occurred."
      );
      setIsProcessing(false); // Re-enable the form
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Payment successful!
      console.log("Payment succeeded:", paymentIntent);
      setPaymentMessage("Payment Successful!");
      // Call the success handler passed from the Dashboard component
      onPaymentSuccess();
      // No need to set isProcessing(false) here usually, as the UI will likely change
      // due to the parent component's state update triggered by onPaymentSuccess.
    } else if (paymentIntent) {
      // Handle other payment intent statuses if necessary (e.g., 'processing', 'requires_action')
      console.log("Payment Intent status:", paymentIntent.status);
      setPaymentMessage(
        `Payment status: ${paymentIntent.status}. Please wait or follow instructions.`
      );
      // Might want to keep isProcessing true or handle based on status
      setIsProcessing(false); // Or adjust based on specific status handling
    } else {
      // Handle unexpected scenarios where there's no error and no paymentIntent
      console.error("Unexpected result from confirmPayment");
      setPaymentMessage(
        "An unexpected issue occurred during payment processing."
      );
      setIsProcessing(false); // Re-enable the form
    }
  };

  // --- Render the Form ---
  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      {/* The PaymentElement dynamically renders input fields based on the PaymentIntent */}
      {/* It securely collects card number, expiry, CVC, postal code, etc. */}
      <PaymentElement
        id="payment-element"
        options={{ layout: "tabs" /* or 'accordion' */ }}
      />

      {/* Payment Button */}
      <button
        disabled={isProcessing || !stripe || !elements}
        id="submit"
        style={{
          marginTop: "20px",
          padding: "12px 20px",
          width: "100%",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor:
            isProcessing || !stripe || !elements ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "bold",
          opacity: isProcessing || !stripe || !elements ? 0.6 : 1,
        }}
      >
        {/* Show dynamic button text based on processing state */}
        {isProcessing ? "Processing..." : "Pay Now"}
      </button>

      {/* Show any error or success messages returned after payment submission */}
      {paymentMessage && (
        <div
          id="payment-message"
          style={{
            marginTop: "15px",
            color:
              paymentMessage.includes("error") ||
              paymentMessage.includes("issue")
                ? "red"
                : "green", // Simple color coding
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {paymentMessage}
        </div>
      )}
    </form>
  );
}

export default CheckoutForm; // Export the component for use in Dashboard.js
