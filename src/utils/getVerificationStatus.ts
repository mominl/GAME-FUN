
export function getVerificationStatus(youtubeSubscribers?: number) {
  const verifiedBy: string[] = [];
  
  // Changed the condition from >= 1000 to >= 0
  if (youtubeSubscribers !== undefined && youtubeSubscribers >= 0) {
    verifiedBy.push('youtube');
  }
  
  return {
    verified: verifiedBy.length > 0,
    verifiedBy,
    // Changed eligibility requirement from >= 1000 to >= 0
    eligibleForMemeCoin: youtubeSubscribers !== undefined && youtubeSubscribers >= 0,
    youtubeSubscribers
  };
}