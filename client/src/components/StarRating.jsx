export default function StarRating({ value, onChange, readOnly = false, label = 'Rating' }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" role={readOnly ? 'img' : 'group'} aria-label={label}>
      {stars.map((star) => {
        const filled = value >= star;
        if (readOnly) {
          return (
            <span
              key={star}
              className={`star-rating__star ${filled ? 'star-rating__star--on' : ''}`}
              aria-hidden="true"
            >
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            className={`star-rating__btn ${filled ? 'star-rating__star--on' : ''}`}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
