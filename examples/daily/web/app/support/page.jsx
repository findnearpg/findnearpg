import { useState } from 'react';

function MainComponent() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = {
    'getting-started': {
      title: 'Getting Started',
      content: [
        'Welcome to draw dAily - where you can bring your drawings to life',
        'Draw directly on our digital canvas',
        'Transform your drawings into enhanced artwork with AI',
        'Save your creations to track your artistic journey',
      ],
    },
    drawing: {
      title: 'Drawing on Canvas',
      content: [
        'Use our simple drawing canvas to create your sketch',
        'Choose different colors',
        'Clear the canvas to start over if needed',
        'Take your time - your work saves automatically',
      ],
    },
    'ai-enhancement': {
      title: 'Enhancing Your Art',
      content: [
        'When your drawing is ready, click "Enhance" to transform it',
        'Add a description of how you want your art enhanced',
        'Our AI will create a new version while keeping true to your original',
        'You can keep both your original and enhanced versions',
      ],
    },
    gallery: {
      title: 'Your Art Gallery',
      content: [
        'All your drawings are saved automatically',
        'View both original sketches and enhanced versions',
        'Track your progress over time',
        'Download or share your favorite pieces',
      ],
    },
    account: {
      title: 'Account Settings',
      content: [
        'Sign in to keep your artwork safe',
        'Access your drawings from any device',
        'Manage your saved artwork',
        'Update your account preferences',
      ],
    },
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-12 font-['IBM_Plex_Mono']">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <button
            onClick={() => window.history.back()}
            className="text-sm hover:opacity-60"
          >
            ←
          </button>
        </div>

        <h1 className="text-4xl font-bold mb-8 tracking-tight">
          Support & Help Center
        </h1>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <nav className="space-y-2 sticky top-6">
              {Object.keys(sections).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveSection(key)}
                  className={`block w-full text-left px-4 py-2 text-sm rounded-lg transition-all ${
                    activeSection === key
                      ? 'bg-black text-white'
                      : 'hover:bg-black/5'
                  }`}
                >
                  {sections[key].title}
                </button>
              ))}
            </nav>
          </div>

          <div className="md:col-span-3 space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-6">
                {sections[activeSection].title}
              </h2>
              <div className="space-y-6">
                {sections[activeSection].content.map((item, index) => (
                  <p key={index} className="text-[#333333] leading-relaxed">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="border-t border-black/10 pt-12">
              <h2 className="text-2xl font-semibold mb-6">Still need help?</h2>
              <p className="text-[#333333] mb-4">
                We're here to assist you with any questions or concerns.
              </p>
              <a
                href="mailto:brendanteo@create.xyz"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Contact Support
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
