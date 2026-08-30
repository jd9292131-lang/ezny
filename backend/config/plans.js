// Regras comerciais do EZNY.
// IMPORTANTE: o plano NORMAL NÃO limita a quantidade de publicações.
// As diferenças Premium são de visibilidade, reputação e publicação sem moderação prévia.
const PLANS = Object.freeze({
  normal: {
    id: 'normal',
    unlimitedListings: true,
    maxImagesPerAd: 4, // limite técnico/anti-abuso, não é limite comercial de anúncios
    canCreatePremiumProfile: false,
    canUseFeaturedAds: false,
    canReceiveRatings: false,
    canPublishWithoutApproval: false,
    canUsePrioritySupport: false,
    canAccessBusinessAnalytics: false
  },
  premium: {
    id: 'premium',
    unlimitedListings: true,
    maxImagesPerAd: 4,
    canCreatePremiumProfile: true,
    canUseFeaturedAds: true,
    canReceiveRatings: true,
    canPublishWithoutApproval: true,
    canUsePrioritySupport: true,
    canAccessBusinessAnalytics: true
  }
});

function getPlan(tipoConta) {
  return PLANS[tipoConta === 'premium' ? 'premium' : 'normal'];
}

module.exports = { PLANS, getPlan };
