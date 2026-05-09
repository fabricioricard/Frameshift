import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import VideoPlayer from "./pages/VideoPlayer";
import LiveStream from "./pages/LiveStream";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/video/:id" component={VideoPlayer} />
      <Route path="/live/:id" component={LiveStream} />
      <Route path="/upload" component={Upload} />
      <Route path="/profile/:id" component={Profile} />
      <Route path="/search" component={Search} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;