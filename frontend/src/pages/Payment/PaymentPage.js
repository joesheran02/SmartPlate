import React, { useState, useEffect } from 'react';
import classes from './paymentPage.module.css';
import { getNewOrderForCurrentUser } from '../../services/orderService';
import Title from '../../components/Title/Title';
import OrderItemsList from '../../components/OrderItemsList/OrderItemsList';
//import Map from '../../components/Map/Map';
// import PaypalButtons from '../../components/PaypalButtons/PaypalButtons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function PaymentPage() {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate=useNavigate()

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getNewOrderForCurrentUser();
        setOrder(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, []);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

const initiateRazorpayPayment = async () => {
  const amount = 50000; // INR 500

  // Call server to create an order
  const { data } = await axios.post("/create-order", { amount, currency: "INR" });

  // Set up options for Razorpay
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Public API key
    amount: amount,
    currency: "INR",
    name: "Your Company",
    description: "Test Transaction",
    image: "/your-logo.png",
    order_id: data.orderId,
    handler: (response) => {
      console.log("Payment successful:", response);
      // Post payment verification logic here
    },
    prefill: {
      name: "Customer Name",
      email: "customer@example.com",
      contact: "9999999999"
    },
    theme: {
      color: "#3399cc"
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
  navigate('/or')
};


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!order) {
    return <div>No order found.</div>;
  }


  return (
    <>
      <div className={classes.container}>
        <div className={classes.content}>
          <Title title="Order Form" fontSize="1.6rem" />
          <div className={classes.summary}>
            <div>
              <h3>Name:</h3>
              <span>{order.name}</span>
            </div>
            <div >
              <h3>AdmNum:</h3>
              <span className='order_adm'>{order.address}</span>
            </div>
          </div>
          <OrderItemsList order={order} />
        </div>

        {/* <div className={classes.map}>
          <Title title="Your Location" fontSize="1.6rem" />
          <Map readonly={true} location={order.addressLatLng} />
        </div> */}

        <div className={classes.buttons_container}>
          <div className={classes.buttons}>
            <button onClick={initiateRazorpayPayment}>Pay with Razorpay</button>
          </div>
          
        </div>
      </div>
    </>
  );
}