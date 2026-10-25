import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticleCard } from '../components/ArticleCard';
import { NewsFilterBar } from '../components/NewsFilterBar';
import { FeaturedHeadline } from '../components/FeaturedHeadline';
import { EmptyState } from '../components/EmptyState';
import { ArticleDetailModal } from '../components/ArticleDetailModal';
import { Article } from '../types';

const mockArticle: Article = {
  id: 'test-article-1',
  title: 'Quantum Computing Lab Achieves 1000-Qubit Coherence Milestone',
  description: 'Physicists demonstrated error-corrected quantum supremacy across complex algorithmic benchmarks.',
  content: 'The quantum processor maintained phase stability for over two milliseconds.',
  canonicalUrl: 'https://example.com/quantum-milestone',
  imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
  author: 'Dr. Evelyn Reed',
  sourceId: 'src-1',
  category: 'technology',
  publishedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  source: {
    id: 'src-1',
    name: 'Quantum Gazette',
    domain: 'quantumgazette.com',
    provider: 'mock',
  },
  analysis: {
    readabilityScore: 78.5,
    readabilityLabel: 'moderate',
    qualityScore: 88,
    sentimentLabel: 'positive',
    sentimentConfidence: 0.92,
    potentialBiasLevel: 'minimal',
    potentialBiasScore: 0.05,
    linguisticSignals: [],
    explanation: 'Standard objective tech reporting.',
    analyzedAt: new Date().toISOString(),
  },
};

describe('ArticleCard Component', () => {
  it('renders headline, source, and transparent AI metrics', () => {
    const handleOpen = vi.fn();
    const handleToggleBookmark = vi.fn();

    render(
      <ArticleCard
        article={mockArticle}
        onOpenAnalysis={handleOpen}
        isBookmarked={false}
        onToggleBookmark={handleToggleBookmark}
      />
    );

    expect(screen.getByText('Quantum Computing Lab Achieves 1000-Qubit Coherence Milestone')).toBeDefined();
    expect(screen.getByText('Quantum Gazette')).toBeDefined();
    expect(screen.getByText('79/100 Ease')).toBeDefined();
    expect(screen.getByText('positive Tone')).toBeDefined();
    expect(screen.getByText('88 Quality')).toBeDefined();
  });

  it('triggers bookmark callback on bookmark button click', () => {
    const handleToggleBookmark = vi.fn();

    render(
      <ArticleCard
        article={mockArticle}
        onOpenAnalysis={vi.fn()}
        isBookmarked={false}
        onToggleBookmark={handleToggleBookmark}
      />
    );

    const bookmarkBtn = screen.getByTitle('Save to bookmarks');
    fireEvent.click(bookmarkBtn);
    expect(handleToggleBookmark).toHaveBeenCalledWith('test-article-1');
  });
});

describe('NewsFilterBar Component', () => {
  it('renders filter controls and resets filters when clicked', () => {
    const handleFilterChange = vi.fn();
    const handleReset = vi.fn();

    render(
      <NewsFilterBar
        filters={{
          category: 'all',
          search: 'quantum',
          sourceId: '',
          sortBy: 'publishedAt',
          order: 'desc',
          page: 1,
          limit: 12,
        }}
        onFilterChange={handleFilterChange}
        onResetFilters={handleReset}
        sources={[{ id: 'src-1', name: 'Quantum Gazette', provider: 'mock' }]}
        totalResults={42}
      />
    );

    expect(screen.getByText('42')).toBeDefined();
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalled();
  });
});

describe('FeaturedHeadline Component', () => {
  it('renders featured lead badge, sentiment tone, and open analysis action', () => {
    const handleOpen = vi.fn();

    render(
      <FeaturedHeadline
        article={mockArticle}
        onOpenAnalysis={handleOpen}
        isBookmarked={true}
        onToggleBookmark={vi.fn()}
      />
    );

    expect(screen.getByText('Featured Lead')).toBeDefined();
    expect(screen.getByText('positive Tone')).toBeDefined();
    expect(screen.getByText('79/100 Readability Ease')).toBeDefined();
    expect(screen.getByText('88 Quality')).toBeDefined();
    const inspectBtn = screen.getByText('Inspect AI Analysis');
    fireEvent.click(inspectBtn);
    expect(handleOpen).toHaveBeenCalledWith(mockArticle);
  });
});

describe('EmptyState Component', () => {
  it('renders custom empty title and reset button', () => {
    const handleReset = vi.fn();
    render(<EmptyState title="Nothing here" onReset={handleReset} />);

    expect(screen.getByText('Nothing here')).toBeDefined();
    const btn = screen.getByText('Reset All Filters');
    fireEvent.click(btn);
    expect(handleReset).toHaveBeenCalled();
  });
});

describe('ArticleDetailModal Component', () => {
  it('renders scientific methodology disclaimer and full AI metrics', () => {
    const handleClose = vi.fn();

    render(
      <ArticleDetailModal
        article={mockArticle}
        onClose={handleClose}
        isBookmarked={false}
        onToggleBookmark={vi.fn()}
      />
    );

    expect(screen.getByText(/Methodology Disclaimer:/)).toBeDefined();
    expect(screen.getByText(/DO NOT/)).toBeDefined();
    expect(screen.getByText('AI Linguistic & Readability Analysis')).toBeDefined();
  });
});
