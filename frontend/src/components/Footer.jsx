import { Link } from "react-router-dom";
import { useState } from "react";
import { Icon } from "./Icons";
import { useToast } from "../context/ToastContext";

export default function Footer() {
  const [email, setEmail] = useState("");
  const toast = useToast();

  const subscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("Thanks for subscribing to Sharanee.");
      setEmail("");
    }
  };

  return (


    <footer className="footer">

      {/*
      <div className="news">
        <div className="container">
          <h3>Subscribe Our Newsletter</h3>
          <form onSubmit={subscribe}>
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">
              Explore More <Icon.Arrow />
            </button>
          </form>
        </div>
      </div> 
     */}

      <div className="foot-main">
        <div className="container foot-grid">
          <div className="foot-brand">
            <img src="/logo.png" alt="Sharanee" />
            <p>
              Sharanee crafts timeless saree inskirts and elegant pins,
              designed for perfect comfort, graceful draping, and a flawless
              fit for every saree and every occasion.
            </p>

            <div className="contact">
              <div><Icon.Phone /> (307) 555-0133</div>
              <div><Icon.Mail /> designer@sharanee.com</div>
            </div>
            <div className="foot-social">
              <a href="#" aria-label="Facebook"><Icon.Facebook /></a>
              <a href="#" aria-label="Twitter"><Icon.X /></a>
              <a href="#" aria-label="Instagram"><Icon.Instagram /></a>
              <a href="#" aria-label="YouTube"><Icon.Youtube /></a>
            </div>
          </div>

          <div className="foot-col">
            <h4>Colors</h4>

            <Link to="/shop?productType=Inskirts">
              Inskirts
            </Link>

            <Link to="/shop?category=Safety%20Pins">
              Safety Pins
            </Link>

            <Link to="/shop?category=Pleat%20Pins">
              Pleat Pins
            </Link>

            <Link to="/shop?category=Pallu%20Pins">
              Pallu Pins
            </Link>

            <Link to="/shop?category=Decorative%20Pins">
              Decorative Pins
            </Link>

            <Link to="/shop?category=Brooch%20Pins">
              Brooch Pins
            </Link>
          </div>


          {/*
          <div className="foot-col">
            <h4>The Company</h4>
            {/* <Link to="/about">About Us</Link>
            <Link to="/blog">Blog</Link> 
          <a href="#">Press</a>
          <a href="#">Sustainability</a>
          <a href="#">Runways</a>
          <a href="#">Careers</a>
        </div>
*/}

          <div className="foot-col">
            <h4>Need Help?</h4>
            <Link to="/contact">Contact Us</Link>

          </div>

          <div className="foot-col">
            <h4>Legal</h4>
            <a href="#">Privacy & Policies</a>
            <a href="#">Fees and Payment</a>
            <a href="#">Terms and Conditions</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-divider">
          <span>✦</span>
        </div>

        <p>
          © {new Date().getFullYear()} Sharanee — Saree Inskirt and Pins. All Rights Reserved.
        </p>
      </div>
    </footer >
  );
}
