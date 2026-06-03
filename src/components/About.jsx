import WaveDivider from './WaveDivider'

function About({ onExit }) {
  return (
    <div className="about-page">
      <div className="study-mode__header">
        <button className="btn-exit-study" onClick={onExit}>← Home</button>
        <span className="study-mode__brand">JAID</span>
        <span className="study-mode__progress">About</span>
      </div>

      <div className="about-content">

        <div className="about-hero">
          <h1 className="about-hero__title">JAID</h1>
          <p className="about-hero__subtitle">Joining Ancestors In Dialogue</p>
          <p className="about-hero__tagline">A free CHamoru language learning app built for diaspora learners who want to reconnect with their heritage language.</p>
        </div>

        <WaveDivider />

        <div className="about-section">
          <div className="about-section__diamond">◆</div>
          <h2 className="about-section__title">The Story</h2>
          <p className="about-section__body">JAID began with someone I loved who wanted to reconnect with her CHamoru heritage. I wanted to learn alongside her, not only so we could share that journey together, but because I loved her and wanted her language to live on. A dear friend and fluent CHamoru speaker became my teacher.</p>
          <blockquote className="about-pullquote">
            "That relationship, and the love behind it, is the reason this app exists."
          </blockquote>
          <p className="about-section__body">I am Hawaiian, Kanaka Maoli, not CHamoru. I am an ally who believes that endangered languages deserve modern tools built with care and humility.</p>
        </div>

        <WaveDivider />

        <div className="about-section">
          <div className="about-section__diamond">◆</div>
          <h2 className="about-section__title">How We Protect the Language</h2>
          <p className="about-section__body">CHamoru spelling and orthography in JAID follows the official standard established by Kumision i Fino' CHamoru. Vocabulary is sourced from Donald Topping's Chamorro English Dictionary and Dr. Faye Untalan's Finu' Chamorro for Beginners and cross referenced against the Kumision's official orthography. Every entry is reviewed by a fluent native CHamoru speaker before it appears to any learner. We do not use AI to generate or describe CHamoru language content.</p>
        </div>

        <WaveDivider />

        <div className="about-section">
          <div className="about-section__diamond">◆</div>
          <h2 className="about-section__title">Built With the Community</h2>
          <p className="about-section__body">JAID is seeking a formal partnership with Kumision i Fino' CHamoru to ensure the app is built the right way for current and future generations of CHamoru learners. The people who hold this language should guide how it is taught.</p>
        </div>

        <WaveDivider />

        <div className="about-section">
          <div className="about-section__diamond">◆</div>
          <h2 className="about-section__title">What Is Coming</h2>
          <p className="about-section__body">Native speaker audio recordings, thematic lessons, spaced repetition, and community features are all on the roadmap.</p>
        </div>

        <WaveDivider />

        <div className="about-dedication">
          <p className="about-dedication__text">For her. Built with love, respect, honesty, and a thoughtful heart. Because her language deserved to live on.</p>
        </div>

        <div className="about-footer">
          <p className="about-footer__text">JAID · Joining Ancestors In Dialogue</p>
          <p className="about-footer__text">Preserving the Language of Guåhan</p>
        </div>

      </div>
    </div>
  )
}

export default About
