import React from 'react';
import LandingHero from '../components/LandingHero';
import LandingFeatures from '../components/LandingFeatures';
import LandingBenefits from '../components/LandingBenefits';
import LandingFooter from '../components/LandingFooter';

const Home: React.FC = () => {
  return (
    <>
      <LandingHero />
      <LandingFeatures />
      <LandingBenefits />
      <LandingFooter />
    </>
  );
};

export default Home; 