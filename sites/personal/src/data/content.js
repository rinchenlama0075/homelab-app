import portrait from "../assets/portrait.jpeg";
import bodhicharya from "../assets/bodhicharya_site.png";
import nuclear from "../assets/nuclear_power_plant.jpeg";

export const profile = {
  name: "Rinchen Lama",
  title: "Software Engineer",
  tagline:
    "Passionately curious — shipping web, mobile, data, and ML work that moves people forward.",
  about: `Passionately curious about anything that catches my interest, I have gotten my hands dirty with a variety of subjects ranging from building web and mobile applications to training convolutional neural networks. Whether it be analyzing data to make decisions or building specific components within large codebases, I am the person who can get it done!

I am a jack of all trades who can pick up any technology and deliver results. With my love for technology, I am looking to be involved in projects that would lead to human prosperity.`,
  portrait,
  email: "rruit0075@gmail.com",
  socials: {
    github: "https://github.com/rinchenlama0075",
    linkedin: "https://www.linkedin.com/in/rinchenlama0075/",
    instagram: "https://www.instagram.com/rinchen_ruit/",
    youtube: "https://www.youtube.com/channel/UC4vt3mUiYe-rx-xA1mFwLRw",
  },
  resumePdf: "/LamaRinchen.pdf",
};

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "Work", to: "/work" },
  { label: "Projects", to: "/projects" },
  { label: "Resume", to: "/resume" },
  { label: "Blogs", to: "/blogs" },
  { label: "App", to: "/social" },
];

export const workItems = [
  {
    title: "PyData NYC Meetup",
    body: `Currently, I am chairing the PyData NYC Meetup Group. I work with an awesome team of volunteers from various stages of their careers — from students to professionals. Together, we serve the PyData community and bring educational and networking events.`,
    links: [
      { label: "Join the meetup", href: "https://www.meetup.com/PyDataNYC/" },
      {
        label: "Meetup website (open source)",
        href: "https://github.com/PyData-NYC-meetup/NYCMeetupWebsite",
      },
      {
        label: "Live site I'm building",
        href: "https://pydata-nyc-meetup.github.io/",
      },
      { label: "PyData", href: "https://www.pydata.org" },
      { label: "NUMFocus", href: "https://www.numfocus.org" },
    ],
  },
  {
    title: "I stream",
    body: `Occasionally, I'll stream myself doing tech stuff or playing chess. I'm not a full-blown content creator yet — but I'm on the path.`,
    links: [
      {
        label: "YouTube channel",
        href: "https://www.youtube.com/channel/UC4vt3mUiYe-rx-xA1mFwLRw",
      },
    ],
  },
];

export const projects = [
  {
    title: "Tech projects on GitHub",
    body: "Explore my repositories — experiments, tools, and shipped work across the stack.",
    image: null,
    href: "https://github.com/rinchenlama0075",
    cta: "View GitHub",
  },
  {
    title: "Bodhicharya Foundation",
    body: "A simple and elegant website for a nonprofit, built on Webflow. I learned a great deal about DNS, SEO, managing domains, and Webflow along the way.",
    image: bodhicharya,
    href: null,
    cta: null,
  },
  {
    title: "EONS",
    body: `Project EONS (Education on Nuclear Science) is an initiative to educate the public in Nepal about nuclear energy. I'm passionate about this because energy independence is crucial for a self-sustaining Nepal.`,
    image: nuclear,
    href: null,
    cta: null,
  },
  {
    title: "GTPN Hackathon",
    body: `An initiative by GTPN (Global Tibetan Professionals Network) to increase involvement of young Tibetans in tech. I serve as Sponsors Outreach Director, working with the Tibetan and broader Himalayan community.`,
    image: null,
    href: "https://globaltibetanprofessionalsnetwork.github.io/website/",
    cta: "About GTPN",
  },
];

export const resume = {
  headline: "Software Engineer",
  education: {
    school: "Hunter College, The City University of New York, NY",
    degree: "Bachelor’s in Computer Science",
  },
  skills:
    "Software Development, Web development, App Development, Automation, Cloud Computing, Web Scraping, Data Analysis, Machine Learning, Artificial Intelligence",
  languages: "C++, Python, ReactJS, Javascript, Swift, SQL, Git, AWS",
  experience: [
    {
      role: "Python Developer",
      org: "Takeo Tech",
      bullets: [
        "Consultant for Dish Network, a satellite TV broadcaster",
        "Worked in a team of 7 engineers to achieve quarterly goals",
        "Automated a software validation process using Python, cutting time from 18+ hours to 3 minutes",
        "Increased deployment frequency from once every 3 months to once a month",
        "Wrote validation for complex microservice architectures and generated reports across up to 11 services",
        "Onboarded new team members and provided knowledge transfer",
        "Built automation with Python, Behave, XML, HTML5, Azure, and Selenium for Dynamic Ad Insertion testing",
        "Used Boto3 and AWS services to monitor, retrieve, process, and analyze logs",
        "Refactored, maintained, and extended a large monolithic Python codebase",
        "Reviewed source code and resolved merge conflicts across multiple projects",
        "Performed end-to-end tests manually and automated them with Python BDD",
      ],
    },
    {
      role: "Student Researcher",
      org: "Google ExploreCSR",
      bullets: [
        "Studied and applied machine learning techniques for image recognition",
        "Used PyTorch Mask R-CNN to analyze food images",
        "Won third place presenting analyses on state-of-the-art ML models in a poster competition",
      ],
    },
    {
      role: "Tech Fellow",
      org: "CodePath",
      bullets: [
        "Developed multiple complete iOS applications following CodePath’s course",
        "Taught an iOS development course to 120+ students with a team of 4 instructors",
      ],
    },
  ],
  volunteer: [
    {
      role: "Organizing Committee Member",
      org: "PyData NYC",
      bullets: [
        "Planned and organized PyData NYC 2022 as executive vice-chair",
        "Managed sponsor relations and prize distribution for PyData NYC 2019",
      ],
      links: [
        { label: "PyData NYC 2022", href: "https://pydata.org/nyc2022/" },
        { label: "PyData NYC 2019", href: "https://pydata.org/nyc2019/" },
      ],
    },
    {
      role: "Organizer (Executive Chair)",
      org: "Hackeo",
      bullets: [
        "Led a team of 13 volunteers for an online hackathon with 200+ participants",
        "Planned and organized the entire event from recruiting to hosting and prizes",
        "Led a Python workshop: “‘hello world!’ to automating tasks in minutes!”",
      ],
      links: [{ label: "Hackeo", href: "https://hack.takeo.ai/" }],
    },
  ],
};

export const blogs = [
  {
    slug: "hackeo",
    title: "Organizing Hackeo: A Thrilling 3-Day Hackathon Adventure",
    excerpt:
      "How a team of friends turned a denied MLH application into a sponsored, 198-person virtual hackathon.",
    path: "/blogs/hackeo",
  },
];

export const hackeoPost = {
  title: "Organizing Hackeo: A Thrilling 3-Day Hackathon Adventure",
  sections: [
    {
      heading: "Recruiting the team",
      subheading: "Gather 'round, folks! Let's hack together!",
      body: `Oh, the joy of working with friends! When I decided to organize the epic Hackeo Hackathon in August 2022, I knew I had to bring together a team that shared my passion. With a little help from my roommate, friends, and their friends, we formed an unstoppable squad: me as the Chair, Aachal as the Vice Chair, and the brilliant minds of Mohit, Shubham, Ameet, Palisha, Sneha, and Tenzin. We were ready to make magic happen!`,
    },
    {
      heading: "Finding sponsorship",
      subheading: "A setback from MLH? No worries — we have Takeo!",
      body: `We hit a tiny roadblock when MLH denied our application for sponsorship. But just when things seemed grim, a hero emerged! My employer, Takeo, came to the rescue and offered to sponsor the entire event. With their support, we knew Hackeo was destined for greatness.`,
    },
    {
      heading: "Logistics",
      subheading: "Navigating the challenges of virtual events",
      body: `We dove headfirst into logistics, determined to make Hackeo seamless. Takeo's development team created a fantastic website that became our virtual hub. We relied on DevPost for registrations and Discord for communication. We even had speakers and tutorials planned for the first two days.`,
    },
    {
      heading: "Prizes",
      subheading: null,
      body: `We hosted three categories — Web, App, and Data — and secured:\n\n• First Prize: Oculus Meta Quest 2\n• Second Prize: Marshall Major IV wireless Bluetooth headphones\n• Category winners: Velocifire portable keyboards`,
    },
    {
      heading: "Marketing",
      subheading: "From small steps to a roaring crowd",
      body: `We leveraged Instagram, Facebook, and Reddit — and printed flyers around town. Our initial goal was 75–100 participants. We ended up with 198. The hype was off the charts!`,
    },
    {
      heading: "Day of",
      subheading: "Lights, camera, hack!",
      body: `As emcee, I kicked off the event in style. The energy was electric as coding adventures, talks, and tutorials unfolded — and projects began taking shape.`,
    },
    {
      heading: "Winners and more",
      subheading: "Go give love to their projects!",
      body: `Check out the gallery on Devpost and give them love. Honorable mention to CodeDuels for bringing “CodeWars” (a side-event) to life.`,
      links: [
        {
          label: "Devpost project gallery",
          href: "https://hackeo.devpost.com/project-gallery",
        },
        {
          label: "CodeDuels",
          href: "https://devpost.com/software/codeduels",
        },
      ],
    },
    {
      heading: "Wrap up",
      subheading: "A hackathon to remember",
      body: `We owe heartfelt thanks to the speakers, participants, sponsors, and the exceptional organizing team. Until our next adventure — keep hacking and pushing the boundaries of innovation.`,
      links: [
        { label: "Hackeo", href: "https://hack.takeo.ai/" },
        { label: "Takeo", href: "https://www.takeo.ai/" },
      ],
    },
  ],
};
