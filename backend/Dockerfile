# syntax=docker/dockerfile:1

ARG RUBY_VERSION=3.3.1
FROM ruby:${RUBY_VERSION}-slim

ENV RAILS_ENV=development \
    NODE_ENV=development \
    BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_BIN=/usr/local/bundle/bin \
    PATH=/app/bin:${BUNDLE_BIN}:${PATH}

# System packages needed for Rails + Postgres + Active Storage variants
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
      build-essential \
      git \
      libpq-dev \
      libvips \
      nodejs \
      postgresql-client \
      curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Ruby gems early to leverage Docker layer caching
COPY Gemfile Gemfile.lock ./
RUN bundle config set without "" && \
    bundle install && \
    rm -rf ~/.bundle/cache

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Default command can be overridden by docker-compose
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3000"]
