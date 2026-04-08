const Press = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Press Kit</h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          Media resources and information about PhotoFlow for journalists and content creators.
        </p>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2 className="text-2xl font-semibold mt-12 mb-6">About PhotoFlow</h2>
          <p className="mb-6">
            PhotoFlow is an AI-powered photo management platform designed specifically for professional photographers. 
            Our platform combines cutting-edge artificial intelligence with intuitive design to help photographers organize, 
            edit, and deliver their work more efficiently. Founded in 2024, we're on a mission to revolutionize how 
            photographers manage their digital workflows.
          </p>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Key Facts</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div>
              <h3 className="font-semibold mb-2">Founded</h3>
              <p className="text-muted-foreground">2024</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Headquarters</h3>
              <p className="text-muted-foreground">Remote-first</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Team Size</h3>
              <p className="text-muted-foreground">15-20 employees</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Users</h3>
              <p className="text-muted-foreground">5,000+ photographers worldwide</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Logo & Brand Assets</h2>
          <p className="mb-6">
            Download our official logos, brand guidelines, and other visual assets:
          </p>
          <div className="space-y-4 mb-12">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
              Download Logo Pack
            </button>
            <button className="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/90 transition-colors ml-4">
              Download Brand Guidelines
            </button>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Press Releases</h2>
          <div className="space-y-6 mb-12">
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">PhotoFlow Launches AI-Powered Photo Management Platform</h3>
              <p className="text-muted-foreground mb-2">March 15, 2024</p>
              <p className="mb-4">PhotoFlow today announced the launch of its revolutionary AI-powered photo management platform designed specifically for professional photographers.</p>
              <button className="text-primary hover:underline">Read Full Press Release</button>
            </div>
            
            <div className="border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">PhotoFlow Secures $2M Seed Funding</h3>
              <p className="text-muted-foreground mb-2">February 28, 2024</p>
              <p className="mb-4">PhotoFlow announced today that it has secured $2 million in seed funding to accelerate product development and expand its team.</p>
              <button className="text-primary hover:underline">Read Full Press Release</button>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Media Coverage</h2>
          <div className="space-y-4 mb-12">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-2">TechCrunch</h3>
              <p className="text-muted-foreground mb-2">"PhotoFlow Uses AI to Simplify Photo Management for Professionals"</p>
              <p className="text-sm text-muted-foreground">March 20, 2024</p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Photography Weekly</h3>
              <p className="text-muted-foreground mb-2">"The Future of Photo Organization: Interview with PhotoFlow's Founder"</p>
              <p className="text-sm text-muted-foreground">April 2, 2024</p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-12 mb-6">Contact</h2>
          <p className="mb-4">
            For media inquiries, press releases, or interview requests, please contact:
          </p>
          <div className="bg-secondary/50 rounded-lg p-6">
            <p className="mb-2"><strong>Email:</strong> press@photoflow.com</p>
            <p className="mb-2"><strong>Phone:</strong> +1 (555) 123-4567</p>
            <p><strong>Response Time:</strong> Within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Press;
