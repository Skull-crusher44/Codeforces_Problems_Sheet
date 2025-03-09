import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip'
import { API_URL, ENDPOINTS } from '../api/config';
import SignupPrompt from './SignupPrompt';
import './CodeforcesSheet.css';

function CodeforcesSheet({ isAuthenticated, onRedirectToSignup }) {
  const [problems, setProblems] = useState([]);
  const [tagCounts, setTagCounts] = useState({});
  const [ratingCounts, setRatingCounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState(new Set());
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState('A');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [sortOrders, setSortOrders] = useState({
    submissions: 'desc',
    time: 'desc',
    rating: 'desc'
  });

  const problemsPerPage = 50;
  const divisions = ['1', '2', '3', '4'];
  const problemIndices = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Cache for API responses
  const [problemsCache, setProblemsCache] = useState(null);
  const [contestsCache, setContestsCache] = useState(null);

  useEffect(() => {
    // Initial data fetch only once
    if (!problemsCache || !contestsCache) {
      fetchInitialData();
    } else {
      // Use cached data for filtering
      processProblems();
    }

    if (isAuthenticated) {
      fetchSolvedProblems();
    } else {
      setSolvedProblems(new Set());
    }
  }, [selectedDivision, selectedIndex, isAuthenticated, problemsCache, contestsCache]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [problemsResponse, contestsResponse] = await Promise.all([
        fetch('https://codeforces.com/api/problemset.problems'),
        fetch('https://codeforces.com/api/contest.list')
      ]);

      const problemsData = await problemsResponse.json();
      const contestsData = await contestsResponse.json();

      if (problemsData.status === 'OK' && contestsData.status === 'OK') {
        setProblemsCache(problemsData);
        setContestsCache(contestsData);
        processProblems(problemsData, contestsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProblems([]);
      setFilteredProblems([]);
      setTagCounts({});
      setRatingCounts({});
    }
    setLoading(false);
  };

  const processProblems = (problemsData = problemsCache, contestsData = contestsCache) => {
    if (!problemsData || !contestsData) return;

    const contestData = {};
    contestsData.result.forEach(contest => {
      contestData[contest.id] = {
        startTime: contest.startTimeSeconds,
        name: contest.name
      };
    });

    const filteredProblems = problemsData.result.problems
      .filter(problem => {
        const contestName = contestData[problem.contestId]?.name || '';
        if (!selectedDivision) return problem.index === selectedIndex;
        return problem.index === selectedIndex &&
          (contestName.includes(`Div. ${selectedDivision}`) || 
          contestName.includes(`Div.${selectedDivision}`));
      })
      .map((problem, index) => ({
        ...problem,
        submissions: problemsData.result.problemStatistics[index].solvedCount,
        publishedDate: contestData[problem.contestId]?.startTime || null,
        contestName: contestData[problem.contestId]?.name || 'Unknown Contest'
      }));

    // Use reduce instead of forEach for better performance
    const newTagCounts = filteredProblems.reduce((acc, problem) => {
      problem.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {});

    const newRatingCounts = filteredProblems.reduce((acc, problem) => {
      const rating = problem.rating || 'Unrated';
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    setProblems(filteredProblems);
    setFilteredProblems(filteredProblems);
    setTagCounts(newTagCounts);
    setRatingCounts(newRatingCounts);
  };

  const fetchSolvedProblems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSolvedProblems(new Set());
        return;
      }
      const response = await axios.get(`${API_URL}${ENDPOINTS.SOLVED_PROBLEMS}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolvedProblems(new Set(response.data.solvedProblems));
    } catch (error) {
      setSolvedProblems(new Set());
    }
  };

  const handleCheckboxChange = async (problemId) => {
    if (!isAuthenticated) {
      setShowSignupPrompt(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const newSolvedProblems = new Set(solvedProblems);
      const action = newSolvedProblems.has(problemId) ? 'remove' : 'add';

      // Optimistically update UI
      if (action === 'remove') {
        newSolvedProblems.delete(problemId);
      } else {
        newSolvedProblems.add(problemId);
      }
      setSolvedProblems(newSolvedProblems);

      // Make API call in background
      axios.post(`${API_URL}${ENDPOINTS.UPDATE_SOLVED_PROBLEM}`, 
        { problemId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(error => {
        console.error('Error updating solved problem:', error);
        // Revert on error
        const revertedProblems = new Set(solvedProblems);
        if (action === 'remove') {
          revertedProblems.add(problemId);
        } else {
          revertedProblems.delete(problemId);
        }
        setSolvedProblems(revertedProblems);
      });
    } catch (error) {
      console.error('Error updating solved problem:', error);
    }
  };

  const updateRatingCounts = (problemsList) => {
    const newRatingCounts = {};
    problemsList.forEach(problem => {
      const rating = problem.rating || 'Unrated';
      newRatingCounts[rating] = (newRatingCounts[rating] || 0) + 1;
    });
    setRatingCounts(newRatingCounts);
  };

  const handleTagClick = (tagName) => {
    setCurrentPage(1);
    if (selectedTag === tagName) {
      setSelectedTag(null);
      setFilteredProblems(problems);
      updateRatingCounts(problems);
    } else {
      setSelectedTag(tagName);
      const filteredByTag = problems.filter(problem =>
        problem.tags.includes(tagName)
      );
      setFilteredProblems(filteredByTag);
      updateRatingCounts(filteredByTag);
    }
  };

  const filterByRating = (selectedRating) => {
    setCurrentPage(1);
    const baseProblems = selectedTag 
      ? problems.filter(problem => problem.tags.includes(selectedTag))
      : problems;

    if (selectedRating === 'all') {
      setFilteredProblems(baseProblems);
    } else {
      setFilteredProblems(baseProblems.filter(problem => {
        const rating = problem.rating || 'Unrated';
        return rating.toString() === selectedRating;
      }));
    }
  };

  const toggleSort = (type) => {
    setSortOrders(prev => {
      const newOrder = prev[type] === 'desc' ? 'asc' : 'desc';
      return { ...prev, [type]: newOrder };
    });

    setFilteredProblems(prev => {
      const sorted = [...prev];
      switch (type) {
        case 'submissions':
          sorted.sort((a, b) => sortOrders.submissions === 'asc'
            ? b.submissions - a.submissions
            : a.submissions - b.submissions);
          break;
        case 'time':
          sorted.sort((a, b) => {
            if (!a.publishedDate) return 1;
            if (!b.publishedDate) return -1;
            return sortOrders.time === 'asc'
              ? b.publishedDate - a.publishedDate
              : a.publishedDate - b.publishedDate;
          });
          break;
        case 'rating':
          sorted.sort((a, b) => {
            if (!a.rating) return 1;
            if (!b.rating) return -1;
            return sortOrders.rating === 'asc'
              ? b.rating - a.rating
              : a.rating - b.rating;
          });
          break;
      }
      return sorted;
    });
  };

  const DivisionSelector = () => (
    <div className="selector-container">
      <h3>Select Division:</h3>
      <div className="button-group">
        <button
          className={`selector-button ${!selectedDivision ? 'selected' : ''}`}
          onClick={() => setSelectedDivision(null)}
        >
          All Divisions
        </button>
        {divisions.map(div => (
          <button
            key={div}
            className={`selector-button ${selectedDivision === div ? 'selected' : ''}`}
            onClick={() => selectedDivision === div ? setSelectedDivision(null) : setSelectedDivision(div)}
          >
            Div. {div}
          </button>
        ))}
      </div>
    </div>
  );

  const ProblemIndexSelector = () => (
    <div className="selector-container">
      <h3>Select Problem Category:</h3>
      <div className="button-group">
        {problemIndices.map(index => (
          <button
            key={index}
            className={`selector-button ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => setSelectedIndex(index)}
          >
            {index}
          </button>
        ))}
      </div>
    </div>
  );

  const RatingStats = () => {
    const sortedRatings = Object.entries(ratingCounts)
      .sort(([a], [b]) => a === 'Unrated' ? 1 : b === 'Unrated' ? -1 : Number(a) - Number(b));
    const maxCount = Math.max(...Object.values(ratingCounts));

    return (
      <div className="rating-stats">
        <h3>Problems by Rating</h3>
        <div className="rating-bars-container">
          <div className="rating-bar" onClick={() => filterByRating('all')}>
            <span className="rating-label" data-tooltip-id="my-tooltip" data-tooltip-content="This will show all Problems Based on Division and Problem Index">All</span>
            <Tooltip id="my-tooltip" />
            <div className="rating-progress">
              <div className="rating-progress-bar" style={{ width: '100%' }}></div>
            </div>
            <span className="rating-count">{problems.length}</span>
          </div>
          {sortedRatings.map(([rating, count]) => (
            <div
              key={rating}
              className="rating-bar"
              onClick={() => filterByRating(rating)}
            >
              <span className="rating-label">{rating}</span>
              <div className="rating-progress">
                <div
                  className="rating-progress-bar"
                  style={{ width: `${(count/maxCount)*100}%` }}
                ></div>
              </div>
              <span className="rating-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TagList = () => {
    const sortedTags = Object.entries(tagCounts).sort(([,a], [,b]) => b - a);

    return (
      <div className="tag-container">
        <div className="tag-header">Total Problems by Tag:</div>
        <button
          className={`tag-button ${!selectedTag ? 'selected' : ''}`}
          onClick={() => handleTagClick(null)}
        >
          All Tags ({problems.length})
        </button>
        {sortedTags.map(([tag, count]) => (
          <button
            key={tag}
            className={`tag-button ${selectedTag === tag ? 'selected' : ''}`}
            onClick={() => handleTagClick(tag)}
          >
            {tag} ({count})
          </button>
        ))}
      </div>
    );
  };

  const ProblemTable = () => {
    const startIndex = (currentPage - 1) * problemsPerPage;
    const endIndex = startIndex + problemsPerPage;
    const problemsToShow = filteredProblems.slice(startIndex, endIndex);

    return (
      <table>
        <thead>
          <tr>
            <th className="status-col">Status</th>
            <th>Problem Name</th>
            <th>Tags</th>
            <th className="sortable" onClick={() => toggleSort('rating')}>
              Rating {sortOrders.rating === 'asc' ? '↑' : '↓'}
            </th>
            <th className="sortable" onClick={() => toggleSort('submissions')}>
              Submissions {sortOrders.submissions === 'asc' ? '↑' : '↓'}
            </th>
            <th className="sortable" onClick={() => toggleSort('time')}>
              Published Date {sortOrders.time === 'asc' ? '↑' : '↓'}
            </th>
          </tr>
        </thead>
        <tbody>
          {problemsToShow.map(problem => {
            const problemId = `${problem.contestId}_${problem.index}`;
            return (
              <tr key={problemId}>
                <td className="status-col">
                  <input
                    type="checkbox"
                    className="problem-checkbox"
                    checked={solvedProblems.has(problemId)}
                    onChange={() => handleCheckboxChange(problemId)}
                  />
                </td>
                <td>
                  <a
                    href={`https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {problem.name}
                  </a>
                  <div className="contest-name">{problem.contestName}</div>
                </td>
                <td>
                  {problem.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </td>
                <td>{problem.rating || 'Unrated'}</td>
                <td>{problem.submissions}</td>
                <td>
                  {problem.publishedDate
                    ? new Date(problem.publishedDate * 1000).toLocaleDateString()
                    : 'N/A'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const Pagination = () => {
    const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

    return (
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => setCurrentPage(prev => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span id="pageInfo">Page {currentPage} of {totalPages}</span>
        <button
          className="page-btn"
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>Codeforces Problems</h1>
      
      <div className="selectors">
        <DivisionSelector />
        <ProblemIndexSelector />
      </div>

      <div className="controls">
        <div className="filter-controls">
          <TagList />
        </div>
        <RatingStats />
      </div>

      {loading ? (
        <div className="loader" style={{ display: 'block' }}>Loading...</div>
      ) : (
        <>
          <ProblemTable />
          <Pagination />
        </>
      )}

      {showSignupPrompt && (
        <SignupPrompt 
          onSignup={() => {
            setShowSignupPrompt(false);
            onRedirectToSignup();
          }}
          onCancel={() => setShowSignupPrompt(false)}
        />
      )}
    </div>
  );
}

export default CodeforcesSheet;
