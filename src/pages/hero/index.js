import React, { useEffect } from "react";
import logo from "../../assets/logo.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { createSparkWallet } from "../../functions/spark";
import { useTranslation } from "react-i18next";

function HeroPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    document.body.style.background = "#00254e";

    async function init() {
      await createSparkWallet();
    }
    init();
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="hero">
      <div className="hero-bg-grid" />
      <div className="hero-content">
        <div className="hero-logo-wrap">
          <img src={logo} className="hero-logo" alt="Blitz" />
          <div className="hero-logo-glow" />
        </div>
        <h1 className="hero-headline">
          {t("hero.headlineLine1")}
          <br />
          {t("hero.headlineLine2")}
        </h1>
        <button
          className="action-button primary hero-cta"
          onClick={() => navigate("/setup")}
        >
          {t("hero.cta")}
        </button>
      </div>
    </div>
  );
}

export default HeroPage;
