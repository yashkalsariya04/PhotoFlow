const Careers = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Careers at PhotoFlow</h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          Join us in revolutionizing photo management for professional photographers worldwide.
        </p>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mt-12 mb-6">Why Work at PhotoFlow?</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-semibold mb-3">Make an Impact</h3>
              <p className="text-muted-foreground">Help thousands of photographers streamline their workflow and grow their business.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Innovative Technology</h3>
              <p className="text-muted-foreground">Work with cutting-edge AI and machine learning technologies.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Remote First</h3>
              <p className="text-muted-foreground">Work from anywhere with flexible hours and a great work-life balance.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Grow With Us</h3>
              <p className="text-muted-foreground">Continuous learning opportunities and career development paths.</p>
            </div>
          </div>
{/*           
          <h2 className="text-2xl font-semibold mt-12 mb-6">Open Positions</h2>
          
          <div className="space-y-6">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Senior Frontend Developer</h3>
              <p className="text-muted-foreground mb-4">Full-time · Remote</p>
              <p className="mb-4">We're looking for an experienced frontend developer to help build our user interface and improve the photographer experience.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                Apply Now
              </button>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">AI/ML Engineer</h3>
              <p className="text-muted-foreground mb-4">Full-time · Remote</p>
              <p className="mb-4">Join our AI team to develop cutting-edge photo recognition and organization algorithms.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                Apply Now
              </button>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Product Designer</h3>
              <p className="text-muted-foreground mb-4">Full-time · Remote</p>
              <p className="mb-4">Help us design intuitive and beautiful interfaces that photographers love to use.</p>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
                Apply Now
              </button>
            </div>
          </div>
           */}
          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Culture</h2>
          <p className="mb-6">
            At PhotoFlow, we believe in fostering an environment where creativity, innovation, and collaboration thrive. 
            We're a diverse team of photographers, engineers, designers, and product thinkers who are passionate about 
            solving real problems for our users.
          </p>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Benefits</h2>
          <ul className="space-y-2">
            <li>Competitive salary and equity</li>
            <li>Comprehensive health, dental, and vision insurance</li>
            <li>Flexible work hours and remote work options</li>
            <li>Professional development budget</li>
            <li>Unlimited PTO</li>
            <li>Latest equipment and tools</li>
            <li>Team retreats and events</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Careers;
