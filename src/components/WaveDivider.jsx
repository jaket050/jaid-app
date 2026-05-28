function WaveDivider() {
  return (
    <div className="wave-divider">
      <svg viewBox="0 0 600 30" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path
          d="M0,15 C75,5 150,25 225,15 C300,5 375,25 450,15 C525,5 600,25 600,15"
          fill="none"
          stroke="#1a3a5c"
          strokeWidth="1.2"
          opacity="0.25"
        />
        <path
          d="M0,20 C75,10 150,30 225,20 C300,10 375,30 450,20 C525,10 600,30 600,20"
          fill="none"
          stroke="#2d6a4f"
          strokeWidth="0.8"
          opacity="0.2"
        />
      </svg>
    </div>
  )
}

export default WaveDivider
