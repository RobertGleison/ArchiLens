import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ROUTER_FUTURE } from '../routerFuture';
import { Card, CardFootnote, SectionHeading, SubsectionHeading } from './Card';
import { TextLink } from './TextLink';

describe('Card', () => {
  it('is a section named by its heading, with subtitle and action', () => {
    render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <Card
          title="Your architecture landscape"
          description="3 projects · 8 repositories"
          action={<TextLink to="/projects">View all projects</TextLink>}
          className="x"
        >
          body
        </Card>
      </MemoryRouter>,
    );
    const section = screen.getByRole('region', { name: 'Your architecture landscape' });
    expect(section.tagName).toBe('SECTION');
    expect(section).toHaveClass('x');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'Your architecture landscape',
    );
    expect(screen.getByText('3 projects · 8 repositories')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View all projects' })).toBeInTheDocument();
    expect(section).toHaveTextContent('body');
  });

  it('uses the configured heading level', () => {
    render(<Card title="Provenance" headingLevel={3} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Provenance' })).toBeInTheDocument();
  });

  it('does not name a div root from its heading', () => {
    render(<Card as="div" title="Plain" />);
    expect(
      screen.getByRole('heading', { name: 'Plain' }).closest('div[aria-labelledby]'),
    ).toBeNull();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('names an article root from its heading', () => {
    render(<Card as="article" title="Report" />);
    expect(screen.getByRole('article', { name: 'Report' })).toBeInTheDocument();
  });

  it('renders a plain div without a title', () => {
    const { container } = render(<Card>content</Card>);
    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('lets an explicit aria-label name the section', () => {
    render(<Card title="Title" aria-label="Custom" />);
    const section = screen.getByRole('region', { name: 'Custom' });
    expect(section).not.toHaveAttribute('aria-labelledby');
  });
});

describe('SectionHeading / SubsectionHeading / CardFootnote', () => {
  it('render headings at the given levels and footnote text', () => {
    render(
      <>
        <SectionHeading title="Section" level={4} />
        <SubsectionHeading
          title="Recently monitored"
          headingId="recent"
          action={<span>All</span>}
        />
        <CardFootnote>Note</CardFootnote>
      </>,
    );
    expect(screen.getByRole('heading', { level: 4, name: 'Section' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Recently monitored' })).toHaveAttribute(
      'id',
      'recent',
    );
    expect(screen.getByText('Note').tagName).toBe('P');
  });
});
