const About = () => {
  return (
    <>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About PhotoFlow</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-muted-foreground mb-8">
              PhotoFlow is an AI-powered photo management platform designed specifically for professional photographers. 
              We combine cutting-edge technology with intuitive design to help you organize, edit, and deliver your work more efficiently.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6">Our Mission</h2>
            <p className="mb-6">
              To empower photographers with intelligent tools that streamline their workflow, allowing them to focus on what they do best - 
              capturing amazing moments and creating beautiful art.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6">Our Story</h2>
            <p className="mb-6">
              Founded in 2024 by a team of photographers and AI engineers, PhotoFlow was born from a simple observation: 
              photographers spend too much time on administrative tasks and not enough time behind the lens. Our platform 
              leverages artificial intelligence to automate tedious processes like photo sorting, face recognition, and client delivery.
            </p>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6">What We Do</h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <span className="text-primary mr-3">AI-Powered Organization</span>
                <span>Automatically sort and categorize your photos using advanced machine learning.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">Smart Client Portals</span>
                <span>Provide clients with personalized, password-protected galleries for easy photo selection and download.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">Event Management</span>
                <span>Streamline your event photography workflow from booking to delivery.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-3">Professional Tools</span>
                <span>Access industry-standard features designed specifically for professional photographers.</span>
              </li>
            </ul>
            
            <h2 className="text-2xl font-semibold mt-12 mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="font-semibold mb-3">Innovation</h3>
                <p className="text-muted-foreground">We constantly push the boundaries of what's possible with AI and photography.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Simplicity</h3>
                <p className="text-muted-foreground">Complex technology should be easy to use. We design with photographers in mind.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Privacy</h3>
                <p className="text-muted-foreground">Your photos and client data are secure. We never compromise on privacy.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Community</h3>
                <p className="text-muted-foreground">We're building a community of photographers who support and learn from each other.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
